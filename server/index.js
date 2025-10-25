const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/socraticcode')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/problems', require('./routes/problems'));
app.use('/api/hints', require('./routes/hints'));
app.use('/api/sessions', require('./routes/sessions'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SocraticCode API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
