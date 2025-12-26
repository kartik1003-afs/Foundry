const express = require('express');
const { 
  lostItemsCollection, 
  foundItemsCollection, 
  matchesCollection 
} = require('../firebase');
const { verifyAuthToken } = require('../middleware/auth');
const router = express.Router();

/**
 * POST /items/lost
 * Create a new lost item (auth required)
 */
router.post('/lost', verifyAuthToken, async (req, res) => {
  try {
    const {
      imageUrl,
      itemType,
      description,
      location,
      dateLost,
      aiLabels = [],
      extractedText = '',
      dominantColor = ''
    } = req.body;

    // Validate required fields
    if (!itemType || !description || !location || !dateLost) {
      return res.status(400).json({ 
        error: 'Missing required fields: itemType, description, location, dateLost' 
      });
    }

    // Create lost item document
    const lostItemData = {
      id: '', // Will be set by Firestore
      imageUrl: imageUrl || '',
      itemType,
      description,
      location,
      dateLost: new Date(dateLost),
      aiLabels,
      extractedText,
      dominantColor,
      createdBy: req.user.uid,
      createdAt: new Date(),
      matched: false
    };

    const docRef = await lostItemsCollection.add(lostItemData);
    
    // Update document with its ID
    await lostItemsCollection.doc(docRef.id).update({ id: docRef.id });

    res.status(201).json({ 
      message: 'Lost item created successfully',
      itemId: docRef.id,
      item: { ...lostItemData, id: docRef.id }
    });

  } catch (error) {
    console.error('Create lost item error:', error);
    res.status(500).json({ 
      error: 'Failed to create lost item' 
    });
  }
});

/**
 * POST /items/found
 * Create a new found item (auth required)
 */
router.post('/found', verifyAuthToken, async (req, res) => {
  try {
    const {
      imageUrl,
      itemType,
      description,
      location,
      dateFound,
      contact,
      aiLabels = [],
      extractedText = '',
      dominantColor = ''
    } = req.body;

    // Validate required fields
    if (!itemType || !description || !location || !dateFound || !contact) {
      return res.status(400).json({ 
        error: 'Missing required fields: itemType, description, location, dateFound, contact' 
      });
    }

    // Validate contact info
    if (!contact.phone) {
      return res.status(400).json({ 
        error: 'Contact phone number is required' 
      });
    }

    // Create found item document
    const foundItemData = {
      id: '', // Will be set by Firestore
      imageUrl: imageUrl || '',
      itemType,
      description,
      location,
      dateFound: new Date(dateFound),
      contact,
      aiLabels,
      extractedText,
      dominantColor,
      createdBy: req.user.uid,
      createdAt: new Date()
    };

    const docRef = await foundItemsCollection.add(foundItemData);
    
    // Update document with its ID
    await foundItemsCollection.doc(docRef.id).update({ id: docRef.id });

    res.status(201).json({ 
      message: 'Found item created successfully',
      itemId: docRef.id,
      item: { ...foundItemData, id: docRef.id }
    });

  } catch (error) {
    console.error('Create found item error:', error);
    res.status(500).json({ 
      error: 'Failed to create found item' 
    });
  }
});

/**
 * GET /items/discover
 * Get all lost and found items (public endpoint)
 * Supports filtering and sorting
 */
router.get('/discover', async (req, res) => {
  try {
    const {
      itemType,
      location,
      status, // 'lost' or 'found' or 'all'
      dateFrom,
      dateTo,
      sortBy = 'newest' // 'newest' or 'oldest'
    } = req.query;

    // Build queries for lost and found items
    let lostQuery = lostItemsCollection;
    let foundQuery = foundItemsCollection;

    // Apply filters
    if (itemType) {
      lostQuery = lostQuery.where('itemType', '==', itemType);
      foundQuery = foundQuery.where('itemType', '==', itemType);
    }

    if (location) {
      lostQuery = lostQuery.where('location', '==', location);
      foundQuery = foundQuery.where('location', '==', location);
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      lostQuery = lostQuery.where('dateLost', '>=', fromDate);
      foundQuery = foundQuery.where('dateFound', '>=', fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      lostQuery = lostQuery.where('dateLost', '<=', toDate);
      foundQuery = foundQuery.where('dateFound', '<=', toDate);
    }

    // Apply sorting
    const sortDirection = sortBy === 'oldest' ? 'asc' : 'desc';
    lostQuery = lostQuery.orderBy('createdAt', sortDirection);
    foundQuery = foundQuery.orderBy('createdAt', sortDirection);

    // Execute queries
    const [lostSnapshot, foundSnapshot] = await Promise.all([
      lostQuery.get(),
      foundQuery.get()
    ]);

    // Process results
    const lostItems = lostSnapshot.docs.map(doc => ({
      ...doc.data(),
      type: 'lost'
    }));

    const foundItems = foundSnapshot.docs.map(doc => ({
      ...doc.data(),
      type: 'found'
    }));

    let allItems = [...lostItems, ...foundItems];

    // Filter by status if specified
    if (status === 'lost') {
      allItems = lostItems;
    } else if (status === 'found') {
      allItems = foundItems;
    }

    // Sort combined results
    allItems.sort((a, b) => {
      const dateA = a.createdAt.toDate ? a.createdAt.toDate() : a.createdAt;
      const dateB = b.createdAt.toDate ? b.createdAt.toDate() : b.createdAt;
      return sortBy === 'oldest' ? dateA - dateB : dateB - dateA;
    });

    res.json({
      items: allItems,
      total: allItems.length
    });

  } catch (error) {
    console.error('Discover items error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch items' 
    });
  }
});

/**
 * GET /items/lost/:uid
 * Get lost items created by a specific user (auth required)
 */
router.get('/lost/user/:uid', verifyAuthToken, async (req, res) => {
  try {
    const { uid } = req.params;

    // Users can only view their own items
    if (uid !== req.user.uid) {
      return res.status(403).json({ 
        error: 'Forbidden: Can only view your own items' 
      });
    }

    const snapshot = await lostItemsCollection
      .where('createdBy', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();

    const items = snapshot.docs.map(doc => doc.data());

    res.json({ items });

  } catch (error) {
    console.error('Get user lost items error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user lost items' 
    });
  }
});

/**
 * GET /items/found/:uid
 * Get found items created by a specific user (auth required)
 */
router.get('/found/user/:uid', verifyAuthToken, async (req, res) => {
  try {
    const { uid } = req.params;

    // Users can only view their own items
    if (uid !== req.user.uid) {
      return res.status(403).json({ 
        error: 'Forbidden: Can only view your own items' 
      });
    }

    const snapshot = await foundItemsCollection
      .where('createdBy', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();

    const items = snapshot.docs.map(doc => doc.data());

    res.json({ items });

  } catch (error) {
    console.error('Get user found items error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user found items' 
    });
  }
});

module.exports = router;
