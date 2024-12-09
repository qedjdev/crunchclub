const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateUsername } = require('../helpers/userHelpers');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate username -- first last-initial OR email with _ instead of @
    const username = await generateUsername(name, email);

    // Create new user with generated username
    const user = new User({
      username,
      email,
      password,
      name,
      dreamCars: [],
      ownedCars: []
    });

    await user.save();
    res.status(201).json({
      message: 'User registered successfully',
      username: username
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({
      $or: [
        // possibly sus
        { username: username },
        { email: username }
      ]
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (password !== user.password) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // profile picture & private info elsewhere
    const userData = {
      id: user._id,
      userId: user.userId,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role // deprecated, we use admin DB now TODO delete
    };

    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router; 