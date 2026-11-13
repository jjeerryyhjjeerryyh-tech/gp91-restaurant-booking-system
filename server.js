const { MongoClient } = require('mongodb');
const url = ""; 
const client = new MongoClient(url);
const dbName = 'restaurantDB';


const findUserByUsername = async (db, username) => {
  var collection = db.collection('users');
  var results = await collection.findOne({ username: username });
  return results;
};

const insertReservation = async (db, reservationObj) => {
  var collection = db.collection('reservations');
  var results = await collection.insertOne(reservationObj);
  return results;
};

const findReservationsByUserId = async (db, userId) => {
  var collection = db.collection('reservations');
  var results = await collection.find({ userId: userId }).toArray();
  return results;
};

const findOneReservationById = async (db, resId) => {
  var collection = db.collection('reservations');
  var results = await collection.findOne({ _id: resId });
  return results;
};

const updateReservation = async (db, resId, updateObj) => {
  var collection = db.collection('reservations');
  var results = await collection.updateOne(
    { _id: resId },
    { $set: updateObj }
  );
  return results;
};

const deleteReservation = async (db, resId) => {
  var collection = db.collection('reservations');
  var results = await collection.deleteOne({ _id: resId });
  return results;
};

const findAllReservations = async (db) => {
  var collection = db.collection('reservations');
  var results = await collection.find({}).toArray();
  return results;
};

async function main() {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);

    // test example
    const user = await findUserByUsername(db, "staff01");
    console.log("Found user >>>", user);

    if(user) {
      const bookings = await findReservationsByUserId(db, user._id);
      console.log("Staff01 bookings >>>", bookings);
    }
}

main()
  .then(console.log("Running your MongoDB-driver!"))
  .catch(console.error)
  .finally(() => client.close());
