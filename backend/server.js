const express = require('express');
const app = express();

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Minimal server running' });
});

app.get('/api/debug', (req, res) => {
  res.json({
    env: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
    mongoUriSet: !!process.env.MONGODB_URI
  });
});

module.exports = app;
