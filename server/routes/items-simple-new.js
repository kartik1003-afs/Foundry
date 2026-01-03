const express = require('express');
const router = express.Router();
const database = require('../services/database');

/**
 * POST /items/lost
 * Create a new lost item with mock matching for testing
 */
router.post('/lost', async (req, res) => {
  try {
    console.log('Received lost item request:', req.body);
    
    const {
      imageUrl,
      itemType,
      category,
      description,
      location,
      dateLost,
      contactInfo
    } = req.body;

    console.log('Extracted fields:', { itemType, category, description, location, dateLost });

    if (!itemType || !description || !location || !dateLost) {
      return res.status(400).json({ 
        error: 'Missing required fields: itemType, description, location, dateLost' 
      });
    }

    // First, save to database
    const itemData = {
      itemType,
      description,
      location,
      dateLost: new Date(dateLost),
      contactInfo: contactInfo || '',
      imageUrl: imageUrl || '',
      reportType: 'lost',
      status: 'active'
    };

    const savedItem = await database.insertItem(itemData);

    // Mock matches for testing
    const mockMatches = [
      {
        itemType: 'key',
        description: 'A small silver key with a red keychain',
        location: 'Library - 2nd floor',
        reportType: 'found',
        imageUrl: 'https://res.cloudinary.com/dpwoayuwx/image/upload/v1767422204/found-items/wtnwtwuwzduyckxlnpkb.webp',
        score: 0.95,
        confidence: 'High',
        reason: 'Image and description are semantically similar'
      }
    ];

    console.log('Using mock matches:', mockMatches);

    res.status(201).json({ 
      message: 'Lost item created successfully',
      item: {
        ...savedItem,
        itemId: 'LOST-KEY-TEST',
        matches: mockMatches
      }
    });

  } catch (error) {
    console.error('Create lost item error:', error);
    res.status(500).json({ 
      error: 'Failed to create lost item' 
    });
  }
});

module.exports = router;
