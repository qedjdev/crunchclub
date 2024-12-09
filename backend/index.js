const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const User = require('./models/User');
const Post = require('./models/Post');
const Counter = require('./models/Counter');
const { generateUsername } = require('./helpers/userHelpers');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const feedRoutes = require('./routes/feedRoutes');
const dataRoutes = require('./routes/dataRoutes');
const authRoutes = require('./routes/authRoutes');
const carRoutes = require('./routes/carRoutes');

dotenv.config();
const app = express();

// Middleware / cors
app.use(cors({
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
  credentials: true
}));

app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crunch_db')
  .then(async () => {
    console.log('Connected to MongoDB');
    await Counter.findOneAndUpdate(
      { _id: 'userId' },
      {},
      { upsert: true, new: true }
    );
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Routes - mount after all middleware
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/cars', carRoutes);

// backward compatibility -- im lazy to fix the routes in frontend :<
// i should have really used dotenv for the api routes in the frontend.
app.get('/api/uploads', (req, res) => {
  res.redirect(307, '/api/data/uploads');
});
app.get('/api/top-shout', (req, res) => {
  res.redirect(307, '/api/posts/top-shout');
});
app.post('/api/register', (req, res) => {
  res.redirect(307, '/api/auth/register');
});
app.post('/api/login', (req, res) => {
  res.redirect(307, '/api/auth/login');
});

// Car API 
app.get('/api/cars', async (req, res) => {
  try {
    const { year, make, model, limit = 10 } = req.query;

    // Build query params
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (make) params.append('make', make);
    if (model) params.append('model', model);
    params.append('limit', limit);

    // call API
    const response = await axios.get(`https://api.api-ninjas.com/v1/cars?${params}`, {
      headers: {
        'X-Api-Key': process.env.CAR_API_KEY // yes hehehe upload my key to github and delete the repo
      }
    });

    // old shitty liter math. not used but,,, load bearing :(
    const transformedData = response.data.map(car => ({
      ...car,
      displacement: car.displacement ? parseFloat((car.displacement / 1000).toFixed(1)) : null
    }));

    res.json(transformedData);
  } catch (error) {
    console.error('Car API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch car data',
      details: error.response?.data || error.message
    });
  }
});

// Start
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
});