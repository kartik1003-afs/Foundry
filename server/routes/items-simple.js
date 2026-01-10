const express = require('express');
const router = express.Router();
const database = require('../services/database');
const aiService = require('../services/aiService');
const emailService = require('../services/emailService');

/**
 * GET /items/user/:email
 * Get all items reported by a specific user
 */
router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('🔍 Fetching items for user:', email);
    
    try {
      await database.connect();
      const allItems = await database.getAllItems();
      console.log('📊 Total items in database:', allItems.length);
      
      // Filter items by contactInfo (email)
      const userItems = allItems.filter(item => 
        item.contactInfo && item.contactInfo.toLowerCase() === email.toLowerCase()
      );
      
      console.log('🔍 Items matching email:', userItems.length);
      console.log('📋 Matching items:', userItems.map(item => ({ id: item._id, type: item.reportType, contact: item.contactInfo })));
      
      console.log(`Found ${userItems.length} items for user ${email}`);
      res.json(userItems);
    } catch (dbError) {
      console.warn('Database not available, returning empty array:', dbError.message);
      // Return empty array if database is not available
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching user items:', error);
    res.status(500).json({ error: 'Failed to fetch user items' });
  }
});

/**
 * DELETE /items/:id
 * Delete an item by ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting item:', id);
    
    await database.connect();
    const success = await database.deleteItem(id);
    
    if (success) {
      res.json({ message: 'Item deleted successfully' });
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

/**
 * POST /items/lost
 * Create a new lost item with mock matching for testing
 */
router.post('/lost', async (req, res) => {
  try {
    console.log('🔍 Received lost item request:', req.body);
    
    // Get all fields with proper fallbacks
    const {
      imageUrl,
      itemType,
      category,
      description,
      location,
      dateLost,
      contactInfo,
      contactNumber,
      reporterName,
      userEmail
    } = req.body;

    console.log('🔍 Extracted fields:', { 
      itemType, 
      category, 
      description, 
      location, 
      dateLost, 
      contactInfo: contactInfo || userEmail || 'NOT_PROVIDED',
      contactNumber: contactNumber || 'NOT_PROVIDED',
      reporterName: reporterName || 'NOT_PROVIDED',
      userEmail
    });

    if (!itemType || !description || !location || !dateLost) {
      console.log('❌ Validation failed - missing fields');
      return res.status(400).json({ 
        error: 'Missing required fields: itemType, description, location, dateLost' 
      });
    }

    // First, save to database with actual data provided
    const itemData = {
      itemType,
      description,
      location,
      dateLost: new Date(dateLost),
      contactInfo: contactInfo || userEmail || 'unknown@example.com',
      contactNumber: contactNumber || '', // Use actual contact number provided
      reporterName: reporterName || '', // Use actual reporter name provided
      imageUrl: imageUrl || '',
      reportType: 'lost',
      status: 'active'
    };

    console.log('💾 Saving to database with data:', itemData);
    const savedItem = await database.insertItem(itemData);
    console.log('✅ Item saved to database:', savedItem);

    // Then, send to AI service for embedding and matching
    try {
      console.log('🤖 About to call AI service with:', { imageUrl, description, location, category: itemType, reportType: 'lost' });
      const aiResponse = await aiService.reportItem({
        imageUrl: imageUrl || '',
        description,
        location,
        category: itemType,
        reportType: 'lost'
      });

      console.log('✅ AI service response received:', aiResponse);

      res.status(201).json({ 
        message: 'Lost item created successfully',
        item: {
          ...savedItem,
          itemId: savedItem._id,
          matches: aiResponse.matches || []
        }
      });
    } catch (aiError) {
      console.error('❌ AI service error:', aiError);
      // Still save item even if AI service fails
      res.status(201).json({ 
        message: 'Lost item created successfully (AI matching temporarily unavailable)',
        item: {
          ...savedItem,
          itemId: savedItem._id,
          matches: []
        }
      });
    }
  } catch (error) {
    console.error('❌ Create lost item error:', error);
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
    console.log('🔍 Received found item request:', req.body);
    
    // Get all fields with proper fallbacks
    const {
      imageUrl,
      itemType,
      description,
      location,
      dateFound,
      contactInfo,
      contactNumber,
      reporterName,
      userEmail
    } = req.body;

    console.log('🔍 Extracted fields:', { 
      itemType, 
      description, 
      location, 
      dateFound, 
      contactInfo: contactInfo || userEmail || 'NOT_PROVIDED',
      contactNumber: contactNumber || 'NOT_PROVIDED',
      reporterName: reporterName || 'NOT_PROVIDED',
      userEmail
    });

    if (!itemType || !description || !location || !dateFound) {
      return res.status(400).json({ 
        error: 'Missing required fields: itemType, description, location, dateFound' 
      });
    }

    // First, save to database with actual data provided
    const itemData = {
      itemType,
      description,
      location,
      dateFound: new Date(dateFound),
      contactInfo: contactInfo || userEmail || 'unknown@example.com',
      contactNumber: contactNumber || '', // Use actual contact number provided
      reporterName: reporterName || '', // Use actual reporter name provided
      imageUrl: imageUrl || '',
      reportType: 'found',
      status: 'active'
    };

    console.log('💾 Saving to database with data:', itemData);

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

      // Update item with AI-generated ID
      await database.updateItem(savedItem._id, {
        itemId: aiResponse.item_id
      });

      // Check for matches with existing lost items
      try {
        console.log('Checking for matches with lost items...');
        const matchesResponse = await aiService.findSimilarItems(aiResponse.embedding || '', 5);
        
        if (matchesResponse && matchesResponse.length > 0) {
          console.log(`Found ${matchesResponse.length} potential matches for found item`);
          
          // Get detailed information for matched lost items
          for (const match of matchesResponse) {
            if (match.score > 0.7) { // Only send notifications for high-confidence matches
              try {
                // Find the corresponding lost item in database
                const lostItems = await database.getAllItems();
                const matchedLostItem = lostItems.find(item => 
                  item.reportType === 'lost' && 
                  item.itemId === match.item_id
                );
                
                if (matchedLostItem && matchedLostItem.contactInfo) {
                  console.log(`Sending match notification for match score: ${match.score}`);
                  await emailService.sendMatchNotification(
                    matchedLostItem,
                    { ...savedItem, itemId: aiResponse.item_id },
                    match.score
                  );
                }
              } catch (emailError) {
                console.error('Failed to send email notification:', emailError);
              }
            }
          }
        }
      } catch (matchError) {
        console.error('Error finding matches:', matchError);
      }

      res.status(201).json({ 
        message: 'Found item reported successfully',
        item: {
          ...savedItem,
          itemId: aiResponse.item_id,
          matchesProcessed: true
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
 * GET /items/lost
 * Get all lost items
 */
router.get('/lost', async (req, res) => {
  try {
    await database.connect();
    const allItems = await database.getAllItems();
    
    // Filter only lost items
    const lostItems = allItems.filter(item => item.reportType === 'lost');
    
    console.log(`Found ${lostItems.length} lost items`);
    res.json(lostItems);
  } catch (error) {
    console.error('Error fetching lost items:', error);
    res.status(500).json({ error: 'Failed to fetch lost items' });
  }
});

/**
 * GET /items/found
 * Get all found items
 */
router.get('/found', async (req, res) => {
  try {
    await database.connect();
    const allItems = await database.getAllItems();
    
    // Filter only found items
    const foundItems = allItems.filter(item => item.reportType === 'found');
    
    console.log(`Found ${foundItems.length} found items`);
    res.json(foundItems);
  } catch (error) {
    console.error('Error fetching found items:', error);
    res.status(500).json({ error: 'Failed to fetch found items' });
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
