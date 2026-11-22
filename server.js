const express = require('express');
const session = require('cookie-session');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const url = "";
const client = new MongoClient(url);
const dbName = 'restaurantDB';

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cookie-Session for Staff Authentication
app.use(session({
    name: 'session',
    keys: ['secret-key-1', 'secret-key-2'],
    maxAge: 24 * 60 * 60 * 1000
}));

const isStaff = (req, res, next) => {
    if (req.session.staffAuthenticated) return next();
    res.redirect('/staff/login');
};

const getDb = () => client.db(dbName);

//  Database Operations
async function findUserByUsername(username) {
    return await getDb().collection('users').findOne({ username: username });
}

async function insertReservation(reservationObj) {
    return await getDb().collection('reservations').insertOne(reservationObj);
}

async function findAllReservations() {
    return await getDb().collection('reservations').find({}).toArray();
}

async function findReservationsByMobile(mobile) {
    return await getDb().collection('reservations').find({ mobile: mobile }).toArray();
}

async function findOneReservationById(resId) {
    return await getDb().collection('reservations').findOne({ _id: new ObjectId(resId) });
}

async function updateReservation(resId, updateObj) {
    return await getDb().collection('reservations').updateOne(
        { _id: new ObjectId(resId) },
        { $set: updateObj }
    );
}

async function deleteReservation(resId) {
    return await getDb().collection('reservations').deleteOne({ _id: new ObjectId(resId) });
}

// ==========================================
// Customer Routes
// ==========================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/book', async (req, res) => {
    await insertReservation({
        customerName: req.body.customerName,
        mobile: req.body.mobile,
        reserveDateTime: req.body.reserveDateTime,
        peopleCount: Number(req.body.peopleCount),
        tableNo: req.body.tableNo,
        note: req.body.note
    });
    res.redirect(`/my-bookings?mobile=${req.body.mobile}`);
});

app.get('/my-bookings', async (req, res) => {
    const mobile = req.query.mobile;
    let bookings = [];
    if (mobile) {
        bookings = await findReservationsByMobile(mobile);
    }
    res.render('my-bookings', { mobile: mobile, bookings: bookings });
});

// ==========================================
// Staff Routes
// ==========================================

app.get('/staff/login', (req, res) => {
    res.render('login');
});

app.post('/staff/login', async (req, res) => {
    const user = await findUserByUsername(req.body.username);
    if (user && user.password === req.body.password) {
        req.session.staffAuthenticated = true;
        req.session.staffName = user.username;
        res.redirect('/staff/dashboard');
    } else {
        res.send('Login failed. <a href="/staff/login">Go back</a>');
    }
});

app.get('/staff/logout', (req, res) => {
    req.session = null;
    res.redirect('/staff/login');
});

app.get('/staff/dashboard', isStaff, async (req, res) => {
    const bookings = await findAllReservations();
    res.render('dashboard', { staffName: req.session.staffName, bookings: bookings });
});

app.get('/staff/edit/:id', isStaff, async (req, res) => {
    const booking = await findOneReservationById(req.params.id);
    res.render('edit', { booking: booking });
});

app.post('/staff/edit/:id', isStaff, async (req, res) => {
    await updateReservation(req.params.id, {
        customerName: req.body.customerName,
        mobile: req.body.mobile,
        reserveDateTime: req.body.reserveDateTime,
        peopleCount: Number(req.body.peopleCount),
        tableNo: req.body.tableNo,
        note: req.body.note
    });
    res.redirect('/staff/dashboard');
});

app.get('/staff/delete/:id', isStaff, async (req, res) => {
    await deleteReservation(req.params.id);
    res.redirect('/staff/dashboard');
});

// ==========================================
// RESTful API (Lecture 8)
// ==========================================

app.get('/api/reservations', async (req, res) => {
    res.json(await findAllReservations());
});

app.post('/api/reservations', async (req, res) => {
    await insertReservation(req.body);
    res.json({ message: "Created" });
});

app.put('/api/reservations/:id', async (req, res) => {
    await updateReservation(req.params.id, req.body);
    res.json({ message: "Updated" });
});

app.delete('/api/reservations/:id', async (req, res) => {
    await deleteReservation(req.params.id);
    res.json({ message: "Deleted" });
});

// Start Server
client.connect().then(() => {
    console.log("Connected to MongoDB successfully");
    app.listen(process.env.PORT || 8099, () => {
        console.log('Server running at http://localhost:8099');
    });
});
