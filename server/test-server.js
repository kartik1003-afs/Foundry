const express = require('express');
require('dotenv').config();

const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Foundry server is running' });
});

// const PORT = process.env.PORT || 5000;
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
