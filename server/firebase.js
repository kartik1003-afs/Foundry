const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
const serviceAccount = {
  project_id: process.env.FIREBASE_PROJECT_ID,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

// Export Firebase services
const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

// Create collections references
const usersCollection = db.collection('users');
const lostItemsCollection = db.collection('lost_items');
const foundItemsCollection = db.collection('found_items');
const matchesCollection = db.collection('matches');

module.exports = {
  admin,
  db,
  auth,
  storage,
  usersCollection,
  lostItemsCollection,
  foundItemsCollection,
  matchesCollection,
};
