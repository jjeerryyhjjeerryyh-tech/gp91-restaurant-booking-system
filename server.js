const express = require('express');
const session = require('cookie-session');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
// Paste your MongoDB Atlas connection string here
const url = "mongodb+srv://hkmu:323911Abc@cluster0.wgy93zk.mongodb.net/";
const client = new MongoClient(url);
const dbName = 'restaurantDB';

// Configure EJS as the view engine (renders files inside /views)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Set { index: false } so public/index.html does not override EJS rendering on "/"
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Cookie-Session for Staff Authentication
app.use(session({
    name: 'session',
    keys: ['key1', 'key2'],
    maxAge: 24 * 60 * 60 * 1000
}));

// Middleware protecting Staff-only pages (redirects unauthorised users to login screen)
const isStaff = (req, res, next) => {
    if (req.session && req.session.staffAuthenticated) return next();
    res.redirect('/staff/login');
};

const getDb = () => client.db(dbName);

// ==================== MongoDB Helper Operations ====================
async function ensureDefaultStaff() {
    const usersCol = getDb().collection('users');
    const existing = await usersCol.findOne({ username: 'staff01' });
    if (!existing) {
        await usersCol.insertOne({
            username: 'staff01',
            password: '123456',
            role: 'staff'
        });
        console.log('Default staff account (staff01) initialized in MongoDB.');
    }
}

async function findUserByUsername(username) {
    return await getDb().collection('users').findOne({ username: (username || '').trim() });
}

async function insertUser(userObj) {
    return await getDb().collection('users').insertOne(userObj);
}

async function insertReservation(reservationObj) {
    return await getDb().collection('reservations').insertOne(reservationObj);
}

async function findAllReservations() {
    return await getDb().collection('reservations').find({}).toArray();
}

async function findReservationsByMobile(mobile) {
    const trimmed = (mobile || '').trim();
    if (!trimmed) return [];
    // Extract digits so both "+852 91234567" and "91234567" or "9123 4567" match cleanly
    const digitsOnly = trimmed.replace(/\D/g, '');
    const pattern = digitsOnly.length >= 6
        ? digitsOnly.split('').join('[\\s-]*')
        : trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return await getDb().collection('reservations').find({
        mobile: { $regex: pattern, $options: 'i' }
    }).toArray();
}

async function findOneReservationById(resId) {
    if (!ObjectId.isValid(resId)) return null;
    return await getDb().collection('reservations').findOne({ _id: new ObjectId(resId) });
}

async function updateReservation(resId, updateObj) {
    if (!ObjectId.isValid(resId)) return { modifiedCount: 0, invalidId: true };
    return await getDb().collection('reservations').updateOne(
        { _id: new ObjectId(resId) },
        { $set: updateObj }
    );
}

async function deleteReservation(resId) {
    if (!ObjectId.isValid(resId)) return { deletedCount: 0, invalidId: true };
    return await getDb().collection('reservations').deleteOne({ _id: new ObjectId(resId) });
}

// Helper to build consistent EJS template data for views/index.ejs
async function buildViewData(req, options = {}) {
    const isAuthenticated = Boolean(req.session && req.session.staffAuthenticated);
    const staffName = isAuthenticated ? req.session.staffName : null;
    let initialBookings = options.initialBookings || [];

    if (isAuthenticated && !options.initialBookings) {
        initialBookings = await findAllReservations();
    }

    return {
        staffAuthenticated: isAuthenticated,
        staffName: staffName,
        activeTab: options.activeTab || 'booking',
        openLoginModal: Boolean(options.openLoginModal),
        loginError: options.loginError || '',
        searchMobile: options.searchMobile || '',
        initialBookings: initialBookings,
        editBookingId: options.editBookingId || null
    };
}

// ==========================================
// Customer Routes (Rendered via views/index.ejs)
// ==========================================

// Homepage: Render views/index.ejs with live session & booking data
app.get('/', async (req, res) => {
    try {
        const viewData = await buildViewData(req, { activeTab: 'booking' });
        res.render('index', viewData);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to load homepage');
    }
});

// Form POST route (/book): Save reservation & redirect to My Bookings
app.post('/book', async (req, res) => {
    try {
        await insertReservation({
            bookingRef: req.body.bookingRef || ('BK-' + Math.floor(10000 + Math.random() * 90000)),
            customerName: req.body.customerName,
            mobile: req.body.mobile,
            email: req.body.email || '',
            reserveDateTime: req.body.reserveDateTime,
            peopleCount: Number(req.body.peopleCount),
            tableNo: req.body.tableNo,
            deposit: Number(req.body.deposit || 0),
            status: req.body.status || 'Confirmed',
            note: req.body.note || ''
        });
        res.redirect(`/my-bookings?mobile=${encodeURIComponent(req.body.mobile)}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Booking submission failed');
    }
});

// My Bookings route: Render views/index.ejs directly on the My Bookings tab
app.get('/my-bookings', async (req, res) => {
    try {
        const mobile = (req.query.mobile || '').trim();
        const bookings = mobile ? await findReservationsByMobile(mobile) : [];
        const viewData = await buildViewData(req, {
            activeTab: 'manage',
            searchMobile: mobile,
            initialBookings: bookings
        });
        res.render('index', viewData);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to look up bookings');
    }
});

// ==========================================
// Staff Routes (Protected by isStaff Middleware)
// ==========================================

app.get('/staff/login', async (req, res) => {
    try {
        if (req.session && req.session.staffAuthenticated) {
            return res.redirect('/staff/dashboard');
        }
        const viewData = await buildViewData(req, {
            activeTab: 'manage',
            openLoginModal: true
        });
        res.render('index', viewData);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to load login page');
    }
});

app.post('/staff/login', async (req, res) => {
    try {
        const username = (req.body.username || '').trim();
        const password = String(req.body.password || '');
        const user = await findUserByUsername(username);
        if (user && String(user.password) === password) {
            req.session.staffAuthenticated = true;
            req.session.staffName = user.username;
            req.session.staffRole = user.role || 'staff';
            res.redirect('/staff/dashboard');
        } else {
            const viewData = await buildViewData(req, {
                activeTab: 'manage',
                openLoginModal: true,
                loginError: 'Invalid username or password. Please try again.'
            });
            res.status(401).render('index', viewData);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Authentication error');
    }
});

app.get('/staff/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
});

// Protected Staff Dashboard route (isStaff middleware enforced)
app.get('/staff/dashboard', isStaff, async (req, res) => {
    try {
        const bookings = await findAllReservations();
        const viewData = await buildViewData(req, {
            activeTab: 'manage',
            initialBookings: bookings
        });
        res.render('index', viewData);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to load staff dashboard');
    }
});

// Protected Staff Edit route (opens the edit modal directly on views/index.ejs)
app.get('/staff/edit/:id', isStaff, async (req, res) => {
    try {
        const bookings = await findAllReservations();
        const viewData = await buildViewData(req, {
            activeTab: 'manage',
            initialBookings: bookings,
            editBookingId: req.params.id
        });
        res.render('index', viewData);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to load reservation for editing');
    }
});

app.post('/staff/edit/:id', isStaff, async (req, res) => {
    try {
        await updateReservation(req.params.id, {
            customerName: req.body.customerName,
            mobile: req.body.mobile,
            reserveDateTime: req.body.reserveDateTime,
            peopleCount: Number(req.body.peopleCount),
            tableNo: req.body.tableNo,
            status: req.body.status || 'Confirmed',
            note: req.body.note
        });
        res.redirect('/staff/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating reservation');
    }
});

app.get('/staff/delete/:id', isStaff, async (req, res) => {
    try {
        await deleteReservation(req.params.id);
        res.redirect('/staff/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting reservation');
    }
});

// ==========================================
// JSON Endpoints for Seamless SPA Interactions
// ==========================================

app.get('/api/staff/status', (req, res) => {
    res.json({
        authenticated: Boolean(req.session && req.session.staffAuthenticated),
        staffName: req.session ? req.session.staffName : null
    });
});

app.post('/api/staff/login', async (req, res) => {
    try {
        const username = (req.body.username || '').trim();
        const password = String(req.body.password || '');
        const user = await findUserByUsername(username);
        if (user && String(user.password) === password) {
            req.session.staffAuthenticated = true;
            req.session.staffName = user.username;
            req.session.staffRole = user.role || 'staff';
            res.json({ success: true, staffName: user.username, role: req.session.staffRole });
        } else {
            res.status(401).json({ success: false, message: 'Invalid username or password.' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Register a new staff account directly into MongoDB (restaurantDB.users)
app.post('/api/staff/register', async (req, res) => {
    try {
        const username = (req.body.username || '').trim();
        const password = String(req.body.password || '');

        if (username.length < 3) {
            return res.status(400).json({ success: false, message: 'Username must be at least 3 characters.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }

        const existing = await findUserByUsername(username);
        if (existing) {
            return res.status(409).json({ success: false, message: 'Username already exists. Please choose another.' });
        }

        await insertUser({
            username: username,
            password: password,
            role: 'staff'
        });

        req.session.staffAuthenticated = true;
        req.session.staffName = username;
        req.session.staffRole = 'staff';

        res.status(201).json({ success: true, staffName: username, role: 'staff' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/staff/logout', (req, res) => {
    req.session = null;
    res.json({ success: true });
});

app.get('/api/my-bookings', async (req, res) => {
    try {
        const mobile = (req.query.mobile || '').trim();
        if (!mobile) return res.json([]);
        res.json(await findReservationsByMobile(mobile));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// RESTful API (GET / POST / PUT / DELETE)
// ==========================================

app.get('/api/reservations', async (req, res) => {
    try {
        res.json(await findAllReservations());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/reservations/:id', async (req, res) => {
    try {
        const booking = await findOneReservationById(req.params.id);
        if (!booking) return res.status(404).json({ error: 'Reservation not found' });
        res.json(booking);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/reservations', async (req, res) => {
    try {
        const doc = { status: 'Confirmed', ...req.body };
        const result = await insertReservation(doc);
        res.status(201).json({ message: "Created", insertedId: result.insertedId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/reservations/:id', async (req, res) => {
    try {
        const result = await updateReservation(req.params.id, req.body);
        if (result.invalidId) return res.status(400).json({ error: 'Invalid reservation ID' });
        res.json({ message: "Updated", modifiedCount: result.modifiedCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/reservations/:id', async (req, res) => {
    try {
        const result = await deleteReservation(req.params.id);
        if (result.invalidId) return res.status(400).json({ error: 'Invalid reservation ID' });
        res.json({ message: "Deleted", deletedCount: result.deletedCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server after MongoDB Connection
client.connect().then(async () => {
    console.log("Connected to MongoDB successfully");
    await ensureDefaultStaff();
    app.listen(process.env.PORT || 8099, () => {
        console.log('Server running at http://localhost:8099');
    });
}).catch(console.error);
