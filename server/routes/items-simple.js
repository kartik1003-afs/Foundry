const express = require('express');
const router = express.Router();
const database = require('../services/database');
const aiService = require('../services/aiService');

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

    // Then, send to AI service for embedding and matching
    try {
      console.log('About to call AI service with:', { imageUrl, description, location, category: itemType, reportType: 'lost' });
      const aiResponse = await aiService.reportItem({
        imageUrl: imageUrl || '',
        description,
        location,
        category: itemType,
        reportType: 'lost'
      });
      console.log('AI service response received:', aiResponse);

      res.status(201).json({ 
        message: 'Lost item created successfully',
        item: {
          ...savedItem,
          itemId: savedItem._id,
          matches: aiResponse.matches
        }
      });

    } catch (error) {
      console.error('AI service error:', error);
      res.status(500).json({ 
        error: 'Failed to create lost item' 
      });
    }

  } catch (error) {
    console.error('Create lost item error:', error);
    res.status(500).json({ 
      error: 'Failed to create lost item' 
    });
  }
});

/**
 * POST /items/found
 * Create a new found item
 */
router.post('/found', async (req, res) => {
  try {
    const {
      imageUrl,
      itemType,
      description,
      location,
      dateFound,
      contactInfo
    } = req.body;

    if (!itemType || !description || !location || !dateFound) {
      return res.status(400).json({ 
        error: 'Missing required fields: itemType, description, location, dateFound' 
      });
    }

    // First, save to database
    const itemData = {
      itemType,
      description,
      location,
      dateFound: new Date(dateFound),
      contactInfo: contactInfo || '',
      imageUrl: imageUrl || '',
      reportType: 'found',
      status: 'active'
    };

    const savedItem = await database.insertItem(itemData);
    console.log('Found item saved to database:', savedItem);

    // Then, send to AI service for embedding and storage
    try {
      const aiResponse = await aiService.reportItem({
        imageUrl: imageUrl || '',
        description,
        location,
        category: itemType,
        reportType: 'found'
      });

      // Update item with AI-generated ID (no matches for found items)
      await database.updateItem(savedItem._id, {
        itemId: aiResponse.item_id
      });

      res.status(201).json({ 
        message: 'Found item reported successfully',
        item: {
          ...savedItem,
          itemId: aiResponse.item_id
        }
      });

    } catch (aiError) {
      console.error('AI service error:', aiError);
      // Still save item even if AI fails
      res.status(201).json({ 
        message: 'Found item reported successfully (AI processing pending)',
        item: savedItem
      });
    }

  } catch (error) {
    console.error('Create found item error:', error);
    res.status(500).json({ 
      error: 'Failed to create found item' 
    });
  }
});

/**
 * GET /items/discover
 * Get all items with optional filtering
 */
router.get('/discover', async (req, res) => {
  try {
    const {
      search = '',
      itemType = '',
      status = 'all',
      dateRange = '',
      sortBy = 'newest'
    } = req.query;

    console.log('Discover filters:', req.query);

    // Get all items first
    let items = await database.getAllItems();
    console.log(`Total items before filtering: ${items.length}`);
    
    // Apply status filter first (most important)
    if (status && status !== 'all') {
      console.log(`Filtering by status: ${status}`);
      items = items.filter(item => item.reportType === status);
      console.log(`Items after status filter (${status}): ${items.length}`);
    }

    // Apply itemType filter
    if (itemType) {
      console.log(`Filtering by itemType: ${itemType}`);
      items = items.filter(item => item.itemType === itemType);
      console.log(`Items after itemType filter (${itemType}): ${items.length}`);
    }
    
    // Apply search filter
    if (search) {
      console.log(`Filtering by search: ${search}`);
      const searchLower = search.toLowerCase();
      items = items.filter(item => 
        item.itemType?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.location?.toLowerCase().includes(searchLower)
      );
      console.log(`Items after search filter: ${items.length}`);
    }

    // Apply date range filter
    if (dateRange) {
      console.log(`Filtering by dateRange: ${dateRange}`);
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (dateRange) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'three-months':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        default:
          break;
      }
      
      items = items.filter(item => {
        const itemDate = new Date(item.createdAt);
        return itemDate >= cutoffDate;
      });
      console.log(`Items after dateRange filter (${dateRange}): ${items.length}`);
    }

    // Apply sorting
    items.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      
      switch (sortBy) {
        case 'oldest':
          return dateA - dateB;
        case 'newest':
        default:
          return dateB - dateA;
      }
    });
    
    console.log(`Returning ${items.length} items after filtering`);
    
    res.json({
      items: items,
      total: items.length
    });

  } catch (error) {
    console.error('Discover items error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch items' 
    });
  }
});

module.exports = router;
