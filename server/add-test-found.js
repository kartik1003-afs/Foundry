const database = require('../services/database');

// Add a test found item to database
const testFoundItem = {
  itemType: 'key',
  description: 'A small silver key with a red keychain',
  location: 'Library - 2nd floor',
  dateFound: new Date('2026-01-03'),
  contactInfo: 'test@example.com',
  imageUrl: 'https://res.cloudinary.com/dpwoayuwx/image/upload/v1767422204/found-items/wtnwtwuwzduyckxlnpkb.webp',
  reportType: 'found',
  status: 'active',
  itemId: 'FOUND-KEYS-TEST'
};

async function addTestFoundItem() {
  try {
    const result = await database.insertItem(testFoundItem);
    console.log('Test found item added:', result);
    process.exit(0);
  } catch (error) {
    console.error('Error adding test found item:', error);
    process.exit(1);
  }
}

addTestFoundItem();
