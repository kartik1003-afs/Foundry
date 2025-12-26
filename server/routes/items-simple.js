const express = require('express');
const router = express.Router();

/**
 * POST /items/lost
 * Create a new lost item (auth required)
 */
router.post('/lost', async (req, res) => {
  try {
    const {
      imageUrl,
      itemType,
      description,
      location,
      dateLost
    } = req.body;

    if (!itemType || !description || !location || !dateLost) {
      return res.status(400).json({ 
        error: 'Missing required fields: itemType, description, location, dateLost' 
      });
    }

    const lostItemData = {
      id: 'mock-' + Date.now(),
      imageUrl: imageUrl || '',
      itemType,
      description,
      location,
      dateLost: new Date(dateLost),
      createdAt: new Date(),
      matched: false
    };

    res.status(201).json({ 
      message: 'Lost item created successfully (mock)',
      itemId: lostItemData.id,
      item: lostItemData
    });

  } catch (error) {
    console.error('Create lost item error:', error);
    res.status(500).json({ 
      error: 'Failed to create lost item' 
    });
  }
});

/**
 * GET /items/discover
 * Get all lost and found items (public endpoint)
 */
router.get('/discover', async (req, res) => {
  try {
    const mockItems = [
      {
        id: 'mock-1',
        itemType: 'Phone',
        description: 'iPhone 12 lost near library',
        location: 'Library',
        dateLost: new Date('2024-01-15'),
        createdAt: new Date(),
        type: 'lost'
      },
      {
        id: 'mock-2', 
        itemType: 'Wallet',
        description: 'Black leather wallet found in cafeteria',
        location: 'Cafeteria',
        dateFound: new Date('2024-01-16'),
        createdAt: new Date(),
        type: 'found'
      }
    ];

    res.json({
      items: mockItems,
      total: mockItems.length
    });

  } catch (error) {
    console.error('Discover items error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch items' 
    });
  }
});

module.exports = router;
