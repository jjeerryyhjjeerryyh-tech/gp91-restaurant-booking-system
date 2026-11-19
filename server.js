const express = require('express');
const session = require('cookie-session');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const url = "mongodb+srv://123456:tkp123456@cluster0.c1lsxgb.mongodb.net/"; 
const client = new MongoClient(url);
const dbName = 'restaurantDB';

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    name: 'session',
    keys: ['secret-key-1', 'secret-key-2'],
    maxAge: 24 * 60 * 60 * 1000 
}));

const isLoggedIn = (req, res, next) => {
    if (req.session.authenticated) return next();
    res.redirect('/login');
};

const getDb = () => client.db(dbName);

// --- database ---
async function findUserByUsername(username) {
    return await getDb().collection('users').findOne({ username: username });
}

async function insertReservation(reservationObj) {
    return await getDb().collection('reservations').insertOne(reservationObj);
}

async function findAllReservations() {
    return await getDb().collection('reservations').find({}).toArray();
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

// --- web page ---
app.get('/login', (req, res) => res.render('login'));

app.post('/login', async (req, res) => {
    const user = await findUserByUsername(req.body.username);
    if (user && user.password === req.body.password) {
        req.session.authenticated = true;
        req.session.username = user.username;
        req.session.userId = user._id.toString(); 
        res.redirect('/');
    } else {
        res.send('Login failed. <a href="/login">Go back</a>');
    }
});

app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/login');
});

app.get('/', isLoggedIn, async (req, res) => {
    const bookings = await findAllReservations();
    res.render('index', { user: req.session.username, bookings: bookings });
});

app.get('/create', isLoggedIn, (req, res) => res.render('create'));

app.post('/create', isLoggedIn, async (req, res) => {
    await insertReservation({
        userId: new ObjectId(req.session.userId), 
        customerName: req.body.customerName,
        mobile: req.body.mobile,
        reserveDateTime: req.body.reserveDateTime,
        peopleCount: Number(req.body.peopleCount),
        tableNo: req.body.tableNo,
        note: req.body.note
    });
    res.redirect('/');
});

app.get('/edit/:id', isLoggedIn, async (req, res) => {
    const booking = await findOneReservationById(req.params.id);
    res.render('edit', { booking: booking });
});

app.post('/edit/:id', isLoggedIn, async (req, res) => {
    await updateReservation(req.params.id, {
        customerName: req.body.customerName,
        mobile: req.body.mobile,
        reserveDateTime: req.body.reserveDateTime,
        peopleCount: Number(req.body.peopleCount),
        tableNo: req.body.tableNo,
        note: req.body.note
    });
    res.redirect('/');
});

app.get('/delete/:id', isLoggedIn, async (req, res) => {
    await deleteReservation(req.params.id);
    res.redirect('/');
});

// --- RESTful API ---
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

client.connect().then(() => {
    console.log("Connected to MongoDB successfully");
    app.listen(process.env.PORT || 8099, () => {
        console.log('Server running at http://localhost:8099');
    });
});

