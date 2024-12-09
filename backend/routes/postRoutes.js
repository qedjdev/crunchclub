const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const mongoose = require('mongoose');
const { isAdmin } = require('../middleware/auth');
const Admin = require('../models/Admin');

// POST /api/posts
router.post('/', async (req, res) => {
  try {
    const { userId, content, isFollowersOnly } = req.body;
    const post = new Post({
      userId,
      content,
      isFollowersOnly: Boolean(isFollowersOnly)
    });
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    console.error('Post creation error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// DELETE /api/posts/:postId
router.delete('/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const requestingUserId = req.query.userId;
    if (!requestingUserId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const [isUserAdmin] = await Promise.all([
      Admin.findOne({ userId: requestingUserId }).then(record => !!record)
    ]);

    if (post.userId.toString() !== requestingUserId && !isUserAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.postId);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// PUT /api/posts/:postId/privacy
router.put('/:postId/privacy', async (req, res) => {
  try {
    const { postId } = req.params;
    const { isFollowersOnly } = req.body;

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { isFollowersOnly },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating privacy:', error);
    res.status(500).json({ error: 'Failed to update privacy settings' });
  }
});

// POST /api/posts/:postId/like
router.post('/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const isLiked = post.likes.includes(userId);
    if (isLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.json({ likes: post.likes.length, isLiked: !isLiked });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ error: 'Failed to update like' });
  }
});

// GET /api/posts/top-shout
router.get('/top-shout', async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // jesus fucking christ
    const topShout = await Post.aggregate([
      {
        $match: {
          isFollowersOnly: false,
          createdAt: { $gte: oneDayAgo }
        }
      },
      {
        $addFields: {
          likes: { $ifNull: ['$likes', []] },
          likesCount: { $size: { $ifNull: ['$likes', []] } }
        }
      },
      {
        $sort: { likesCount: -1 }
      },
      {
        $limit: 1
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId'
        }
      },
      {
        $unwind: '$userId'
      },
      {
        $project: {
          content: 1,
          likes: 1,
          createdAt: 1,
          isFollowersOnly: 1,
          'userId._id': 1,
          'userId.name': 1,
          'userId.username': 1,
          'userId.profilePicture': 1
        }
      }
    ]).exec();

    res.json(topShout[0] || null);
  } catch (error) {
    console.error('Error fetching top shout:', error);
    res.status(500).json({ error: 'Failed to fetch top shout' });
  }
});

module.exports = router; 