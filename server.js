const express = require('express');
const session = require('cookie-session');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const url = "";
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















//start server
client.connect().then(() => {
    console.log("Connected to MongoDB successfully");
    
    const server = app.listen(process.env.PORT || 8099, () => {
        const port = server.address().port;
        console.log(`Server listening at port ${port}`);
    });
    
}).catch(console.error);

