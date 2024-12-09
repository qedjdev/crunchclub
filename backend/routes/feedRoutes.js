const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Admin = require('../models/Admin');

// GET /api/feed
router.get('/', async (req, res) => {
  try {
    const { viewerId, page = 0 } = req.query;
    const pageSize = 3;
    const skip = parseInt(page) * pageSize;
    const isAdmin = await Admin.findOne({ userId: viewerId });

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize * 3) // load 3 per button press
      .populate('userId', 'name username profilePicture')
      .lean();

    const filteredPosts = [];
    for (const post of posts) {
      const postWithLikes = {
        ...post,
        likes: post.likes || []
      };

      // admin, include all posts
      if (isAdmin) {
        filteredPosts.push(postWithLikes);
      }
      // non-admins, apply normal filtering
      else if (!postWithLikes.isFollowersOnly) {
        filteredPosts.push(postWithLikes);
      }
      else if (viewerId) {
        const user = await User.findById(post.userId._id);
        if (user && user.followers.includes(viewerId)) {
          filteredPosts.push(postWithLikes);
        }
        else if (viewerId === post.userId._id.toString()) {
          filteredPosts.push(postWithLikes);
        }
      }

      // break if we have enough (3) posts
      if (filteredPosts.length >= pageSize) {
        break;
      }
    }

    // Check if there are more posts
    const hasMore = posts.length > filteredPosts.length;

    res.json(filteredPosts.slice(0, pageSize));
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

// GET /api/feed/following
router.get('/following', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const user = await User.findById(userId);
    if (!user || !user.following.length) {
      return res.json([]);
    }

    const posts = await Post.find({
      userId: { $in: user.following }
    })
      .sort({ createdAt: -1 })
      .limit(3) // dont need to do privacy checking for ===3
      .populate('userId', 'name username profilePicture')
      .lean();

    const postsWithLikes = posts.map(post => ({
      ...post,
      likes: post.likes || []
    }));

    res.json(postsWithLikes);
  } catch (error) {
    console.error('Error fetching following feed:', error);
    res.status(500).json({ error: 'Failed to fetch following feed' });
  }
});

module.exports = router; 