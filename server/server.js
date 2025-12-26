const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import simple routes (without Firebase for now)
const authRoutes = require('./routes/auth-simple');
const itemRoutes = require('./routes/items-simple');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Foundry server is running' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port ", PORT);
  console.log("Available endpoints:");
  console.log("  GET  /health");
  console.log("  POST /api/auth/create-user");
  console.log("  POST /api/items/lost");
  console.log("  GET  /api/items/discover");
});
