const express = require('express');
const { auth, usersCollection } = require('../firebase');
const router = express.Router();

/**
 * POST /auth/create-user
 * Create user document in Firestore after Firebase Auth signup
 * This endpoint is called after successful Firebase Authentication
 */
router.post('/create-user', async (req, res) => {
  try {
    const { uid, name, email } = req.body;

    if (!uid || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields: uid and email' 
      });
    }

    // Check if user already exists
    const userDoc = await usersCollection.doc(uid).get();
    if (userDoc.exists) {
      return res.status(400).json({ 
        error: 'User already exists' 
      });
    }

    // Create user document in Firestore
    const userData = {
      uid,
      name: name || email.split('@')[0], // Use name or email prefix
      email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await usersCollection.doc(uid).set(userData);

    res.status(201).json({ 
      message: 'User created successfully',
      user: userData 
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ 
      error: 'Failed to create user' 
    });
  }
});

/**
 * GET /auth/user/:uid
 * Get user profile by UID
 */
router.get('/user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    const userDoc = await usersCollection.doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    const userData = userDoc.data();
    res.json(userData);

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      error: 'Failed to get user' 
    });
  }
});

module.exports = router;
