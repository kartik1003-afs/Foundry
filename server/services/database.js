require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

class DatabaseService {
  constructor() {
    this.dbPath = path.join(__dirname, '../data/items.json');
    this.items = [];
    this.loadItems();
  }

  async loadItems() {
    try {
      const data = await fs.readFile(this.dbPath, 'utf8');
      this.items = JSON.parse(data);
      console.log(`Loaded ${this.items.length} items from local storage`);
    } catch (error) {
      console.log('No existing items file, starting with empty array');
      this.items = [];
      await this.saveItems();
    }
  }

  async saveItems() {
    try {
      await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
      await fs.writeFile(this.dbPath, JSON.stringify(this.items, null, 2));
    } catch (error) {
      console.error('Error saving items:', error);
    }
  }

  async insertItem(itemData) {
    try {
      console.log('Attempting to insert item:', itemData);
      const item = {
        ...itemData,
        _id: Date.now().toString(), // Use timestamp as ID
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      this.items.push(item);
      await this.saveItems();
      console.log('Item inserted successfully:', item);
      return { ...item, _id: item._id };
    } catch (error) {
      console.error('Error inserting item:', error);
      throw error;
    }
  }

  async getAllItems() {
    try {
      console.log('Fetching all items');
      return this.items.map(item => ({ ...item, _id: item._id.toString() }));
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  }

  async getItemById(id) {
    try {
      const item = this.items.find(item => item._id.toString() === id.toString());
      if (!item) {
        throw new Error('Item not found');
      }
      return { ...item, _id: item._id.toString() };
    } catch (error) {
      console.error('Error fetching item by ID:', error);
      throw error;
    }
  }

  async updateItem(id, updateData) {
    try {
      const items = await this.itemsCollection.find({ reportType }).toArray();
      return items.map(item => ({ ...item, _id: item._id.toString() }));
    } catch (error) {
      console.error('Error fetching items by type:', error);
      throw error;
    }
  }

  async updateItem(itemId, updateData) {
    try {
      const result = await this.itemsCollection.updateOne(
        { itemId },
        { 
          $set: { 
            ...updateData, 
            updatedAt: new Date() 
          } 
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  }

  async deleteItem(id) {
    try {
      const index = this.items.findIndex(item => item._id.toString() === id.toString());
      if (index === -1) {
        throw new Error('Item not found');
      }
      
      const deletedItem = this.items.splice(index, 1)[0];
      await this.saveItems();
      return { ...deletedItem, _id: deletedItem._id.toString() };
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }

  async getItemsByType(type) {
    try {
      return this.items
        .filter(item => item.itemType?.toLowerCase().includes(type.toLowerCase()))
        .map(item => ({ ...item, _id: item._id.toString() }));
    } catch (error) {
      console.error('Error fetching items by type:', error);
      throw error;
    }
  }

  async close() {
    // Removed client close logic as it's not relevant to local JSON storage
  }
}

module.exports = new DatabaseService();
