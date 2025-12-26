const express = require('express');
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

    // TODO: Implement Firebase storage
    const userData = {
      uid,
      name: name || email.split('@')[0],
      email,
      createdAt: new Date(),
    };

    res.status(201).json({ 
      message: 'User created successfully (mock)',
      user: userData 
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ 
      error: 'Failed to create user' 
    });
  }
});

module.exports = router;
