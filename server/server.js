const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth-simple');
const itemRoutes = require('./routes/items-simple');
const uploadRoutes = require('./routes/upload');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Foundry server is running' });
});

// Start server
const PORT = 3001;

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log(' SIGTERM received, shutting down gracefully');
  try {
    // await database.close(); // Commented out as database is not defined
    console.log(' Database closed successfully');
  } catch (error) {
    console.error(' Error closing database:', error);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log(' SIGINT received, shutting down gracefully');
  try {
    // await database.close(); // Commented out as database is not defined
    console.log(' Database closed successfully');
  } catch (error) {
    console.error(' Error closing database:', error);
  }
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error, origin) => {
  console.error(' Uncaught Exception:', error);
  console.error('Origin:', origin);
  try {
    // await database.close(); // Commented out as database is not defined
  } catch (dbError) {
    console.error('Error closing database on uncaught exception:', dbError);
  }
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(' Unhandled Rejection at:', promise, 'reason:', reason);
  try {
    // await database.close(); // Commented out as database is not defined
  } catch (dbError) {
    console.error('Error closing database on unhandled rejection:', dbError);
  }
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(" Server running on port ", PORT);
  console.log("Available endpoints:");
  console.log("  GET  /health");
  console.log("  POST /api/auth/create-user");
  console.log("  POST /api/items/lost");
  console.log("  POST /api/items/found");
  console.log("  GET  /api/items/discover");
  console.log("  GET  /api/items/lost");
  console.log("  GET  /api/items/found");
  console.log("  GET  /api/items/user/:email");
  console.log("  DELETE /api/items/:id");
  console.log("  POST /api/upload/upload");
  console.log("  DELETE /api/upload/delete/:publicId");
});

console.log('Starting server...');
