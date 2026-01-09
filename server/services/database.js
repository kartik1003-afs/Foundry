require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

class DatabaseService {
  constructor() {
    this.client = null;
    this.db = null;
    this.itemsCollection = null;
  }

  async connect() {
    try {
      this.client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
      await this.client.connect();
      this.db = this.client.db('foundry');
      this.itemsCollection = this.db.collection('items');
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async insertItem(itemData) {
    try {
      console.log('Attempting to insert item:', itemData);
      const item = {
        ...itemData,
        _id: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await this.itemsCollection.insertOne(item);
      console.log('Item inserted successfully, ID:', result.insertedId);
      return { ...item, _id: result.insertedId.toString() };
    } catch (error) {
      console.error('Error inserting item:', error);
      throw error;
    }
  }

  async getAllItems() {
    try {
      const items = await this.itemsCollection.find({}).toArray();
      return items.map(item => ({ ...item, _id: item._id.toString() }));
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  }

  async getItemById(itemId) {
    try {
      const item = await this.itemsCollection.findOne({ itemId });
      return item ? { ...item, _id: item._id.toString() } : null;
    } catch (error) {
      console.error('Error fetching item:', error);
      throw error;
    }
  }

  async getItemsByType(reportType) {
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

  async deleteItem(itemId) {
    try {
      const result = await this.itemsCollection.deleteOne({ itemId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }

  async close() {
    if (this.client) {
      await this.client.close();
    }
  }
}

module.exports = new DatabaseService();
