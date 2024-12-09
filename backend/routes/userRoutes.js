const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Car = require('../models/Car');
const Post = require('../models/Post');
const upload = require('../middleware/upload');
const Counter = require('../models/Counter');
const path = require('path');
const fs = require('fs').promises;
const { isAdmin } = require('../middleware/auth');
const Admin = require('../models/Admin');

//
// There are some duplicated routes here... 
//

// GET /api/users/search - must be before any :userId routes
router.get('/search', async (req, res) => {
  try {
    const { name } = req.query;
    const query = name ? {
      $or: [
        { name: new RegExp(name, 'i') },
        { email: new RegExp(name, 'i') },
        { username: new RegExp(name, 'i') }
      ]
    } : {};

    const users = await User.find(query)
      .select('-password') // sooooo safe awesome bro >:) <pws r hashed anyway>
      .limit(20); // max 20, user should just refine their search terms. fk u pagination

    res.json(users);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/search-cars - must be before any :userId routes
router.get('/search-cars', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }

    const searchRegex = new RegExp(q, 'i');

    // try to parse year
    const year = parseInt(q);
    const query = {
      $or: [
        { make: searchRegex },
        { model: searchRegex }
      ]
    };

    if (!isNaN(year)) {
      query.$or.push({ year: year });
    }

    const cars = await Car.find(query)
      .populate('user', 'name username')
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    console.log('Search query:', q);
    console.log('Mongoose query:', JSON.stringify(query));
    console.log('Found cars:', cars);

    res.json(cars);
  } catch (error) {
    console.error('Error searching cars:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Failed to search cars', details: error.message });
  }
});

// GET /api/users/recent-with-photos
router.get('/recent-with-photos', async (req, res) => {
  try {
    const recentUsers = await User.find({
      profilePicture: { $exists: true, $ne: null }
    })
      .select('name username profilePicture')
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    res.json(recentUsers);
  } catch (error) {
    console.error('Error fetching recent users:', error);
    res.status(500).json({ error: 'Failed to fetch recent users' });
  }
});

// PUT /api/users/:userId/username
router.put('/:userId/username', async (req, res) => {
  try {
    const { userId } = req.params;
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // usernames are distinct
    const existingUser = await User.findOne({ username, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // update
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating username:', error);
    res.status(500).json({ error: 'Failed to update username' });
  }
});

// GET /api/users/:userId
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password') // maybe make a separate collection for privacy lmao whatever TODO
      .populate('followers', '_id name username')
      .populate('following', '_id name username')
      .populate('ownedCars');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = {
      ...user.toObject(),
      followers: user.followers,
      following: user.following,
      followerCount: user.followers.length, // reduce load on user device for large followings
      followingCount: user.following.length // real site cache this info
    };

    res.json(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const { name } = req.query;
    const query = name ? { name: new RegExp(name, 'i') } : {};

    const users = await User.find(query)
      .select('-password')
      .limit(20);

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:userId/dream-cars
router.get('/:userId/dream-cars', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.dreamCars);
  } catch (error) {
    console.error('Error fetching dream cars:', error);
    res.status(500).json({ error: 'Failed to fetch dream cars' });
  }
});

// POST /api/users/:userId/dream-cars
router.post('/:userId/dream-cars', async (req, res) => {
  try {
    const { userId } = req.params;
    const { car } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if car already exists in dream cars
    const carExists = user.dreamCars.some(dreamCar => {
      return Object.keys(car).every(key => car[key] === dreamCar[key]);
    });

    if (carExists) {
      // delete
      user.dreamCars = user.dreamCars.filter(dreamCar => {
        return !Object.keys(car).every(key => car[key] === dreamCar[key]);
      });
    } else {
      user.dreamCars.push(car);
    }

    await user.save();
    res.json({ dreamCars: user.dreamCars, isFavorite: !carExists });
  } catch (error) {
    console.error('Error updating dream cars:', error);
    res.status(500).json({ error: 'Failed to update dream cars' });
  }
});

// GET /api/users/:userId/owned-cars
router.get('/:userId/owned-cars', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate({
      path: 'ownedCars',
      populate: { path: 'user', select: 'name username' }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.ownedCars);
  } catch (error) {
    console.error('Error fetching owned cars:', error);
    res.status(500).json({ error: 'Failed to fetch owned cars' });
  }
});

// POST /api/users/:userId/owned-cars
router.post('/:userId/owned-cars', upload.single('image'), async (req, res) => {
  try {
    const { userId } = req.params;

    const carData = req.file ? JSON.parse(req.body.car) : req.body.car;
    const description = req.body.description || "no description provided";

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create a new car document with required fields
    const car = new Car({
      make: carData.make,
      model: carData.model,
      year: carData.year,
      transmission: carData.transmission || '',
      fuel_type: carData.fuel_type || '',
      drive: carData.drive || '',
      cylinders: carData.cylinders || null,
      class: carData.class || '',
      city_mpg: carData.city_mpg || null,
      highway_mpg: carData.highway_mpg || null,
      combination_mpg: carData.combination_mpg || null,
      description,
      image: req.file ? `/uploads/${req.file.filename}` : null,
      user: userId,  // Set the original user
      owners: [{     // Add initial owner
        _id: userId,
        name: user.name,
        username: user.username,
        joinedAt: new Date()
      }]
    });

    await car.save();

    // Add car reference to user's ownedCars
    user.ownedCars.push(car._id);
    await user.save();

    const populatedUser = await User.findById(userId).populate({
      path: 'ownedCars',
      populate: { path: 'user', select: 'name username' }
    });

    res.json({
      ownedCars: populatedUser.ownedCars,
      isFavorite: true
    });
  } catch (error) {
    console.error('Error updating owned cars:', error);
    res.status(500).json({ error: 'Failed to update owned cars', details: error.message });
  }
});

// DELETE /api/users/:userId/owned-cars/:carId
router.delete('/:userId/owned-cars/:carId', async (req, res) => {
  try {
    const { userId, carId } = req.params;

    const user = await User.findById(userId);
    const car = await Car.findById(carId);

    if (!user || !car) {
      return res.status(404).json({ error: 'User or car not found' });
    }

    car.owners = car.owners.filter(id => !id.equals(userId));
    await car.save();

    user.ownedCars = user.ownedCars.filter(id => !id.equals(carId));
    await user.save();

    if (car.owners.length === 0) {
      await Car.findByIdAndDelete(carId);
    }

    const populatedUser = await User.findById(userId).populate({
      path: 'ownedCars',
      populate: { path: 'user', select: 'name username' }
    });
    res.json({
      ownedCars: populatedUser.ownedCars,
      isFavorite: false
    });
  } catch (error) {
    console.error('Error removing owned car:', error);
    res.status(500).json({ error: 'Failed to remove owned car' });
  }
});

// PATCH /api/users/:userId/owned-cars/:carId
router.patch('/:userId/owned-cars/:carId', upload.single('image'), async (req, res) => {
  try {
    const { userId, carId } = req.params;

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const isOwner = car.owners.some(owner => owner._id.toString() === userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'User does not own this car' });
    }

    if (req.file) {
      car.image = `/uploads/${req.file.filename}`;
    }

    await car.save();

    const updatedCar = await Car.findById(carId)
      .populate('user', 'name username profilePicture')
      .populate('owners');

    res.json(updatedCar);
  } catch (error) {
    console.error('Error updating car:', error);
    res.status(500).json({ error: 'Failed to update car' });
  }
});

// GET /api/users/:userId/posts
router.get('/:userId/posts', async (req, res) => {
  try {
    console.log('\n=== POST FETCH REQUEST ===');
    console.log('Request params:', {
      userId: req.params.userId,
      viewerId: req.query.viewerId,
      viewerIdType: typeof req.query.viewerId
    });

    const viewerId = req.query.viewerId || null;
    console.log('Processed viewerId:', {
      viewerId,
      type: typeof viewerId,
      isNull: viewerId === null
    });

    console.log('Finding user...');
    const user = await User.findById(req.params.userId);
    console.log('User found:', {
      found: !!user,
      followers: user?.followers?.length,
      id: user?._id
    });

    if (!user) {
      console.log('User not found, returning 404');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Finding posts...');
    const posts = await Post.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name username profilePicture')
      .lean();
    console.log('Posts found:', posts.length);

    // For non-logged-in users, only return public posts
    if (!viewerId) {
      console.log('No viewerId - filtering for public posts only');
      const publicPosts = posts.map(post => ({
        ...post,
        likes: post.likes || []
      })).filter(post => !post.isFollowersOnly);
      console.log('Returning public posts:', publicPosts.length);
      return res.json(publicPosts);
    }

    console.log('Checking admin status for viewerId:', viewerId);
    try {
      const isAdmin = await Admin.findOne({ userId: viewerId });
      console.log('Admin check result:', !!isAdmin);
    } catch (adminError) {
      console.error('Error during admin check:', {
        error: adminError.message,
        stack: adminError.stack,
        viewerId
      });
    }

    const postsWithLikes = posts.map(post => ({
      ...post,
      likes: post.likes || []
    }));

    console.log('Filtering posts for regular user');
    const filteredPosts = postsWithLikes.filter(post => {
      const isPublic = !post.isFollowersOnly;
      const isOwner = viewerId === req.params.userId;
      const isFollower = user.followers.includes(viewerId);

      console.log('Post filter check:', {
        postId: post._id,
        isPublic,
        isOwner,
        isFollower,
        decision: isPublic || isOwner || isFollower
      });

      return isPublic || isOwner || isFollower;
    });

    console.log('Returning filtered posts:', filteredPosts.length);
    res.json(filteredPosts);

  } catch (error) {
    console.error('\n=== ERROR IN POSTS ROUTE ===');
    console.error('Full error object:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code
    });
    console.error('Request details:', {
      userId: req.params.userId,
      viewerId: req.query.viewerId,
      path: req.path,
      method: req.method
    });
    res.status(500).json({
      error: 'Failed to fetch posts',
      details: error.message,
      name: error.name
    });
  }
});

// GET /api/users/:userId/top-shout
router.get('/:userId/top-shout', async (req, res) => {
  try {
    const { userId } = req.params;

    const topShout = await Post.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          isFollowersOnly: false
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
      }
    ]).exec();

    if (!topShout.length) {
      return res.json(null);
    }

    res.json({
      content: topShout[0].content,
      likes: topShout[0].likes,
      createdAt: topShout[0].createdAt
    });
  } catch (error) {
    console.error('Error fetching top shout:', error);
    res.status(500).json({ error: 'Failed to fetch top shout' });
  }
});

// POST /api/users/:userId/follow
router.post('/:userId/follow', async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.body.followerId;

    const [userToFollow, follower] = await Promise.all([
      User.findById(userId),
      User.findById(followerId)
    ]);

    if (!userToFollow || !follower) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userToFollow.followers.includes(followerId)) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    await Promise.all([
      User.findByIdAndUpdate(userId, { $push: { followers: followerId } }),
      User.findByIdAndUpdate(followerId, { $push: { following: userId } })
    ]);

    const updatedUser = await User.findById(userId)
      .select('-password')
      .populate('followers', '-password')
      .populate('following', '-password');

    res.json(updatedUser);
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// POST /api/users/:userId/unfollow
router.post('/:userId/unfollow', async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.body.followerId;

    await Promise.all([
      User.findByIdAndUpdate(userId, { $pull: { followers: followerId } }),
      User.findByIdAndUpdate(followerId, { $pull: { following: userId } })
    ]);

    const updatedUser = await User.findById(userId)
      .select('-password')
      .populate('followers', '-password')
      .populate('following', '-password');

    res.json(updatedUser);
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// GET /api/users/:userId/followers
router.get('/:userId/followers', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('followers', '-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.followers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

// GET /api/users/:userId/following
router.get('/:userId/following', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('following', '-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.following);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch following' });
  }
});

// GET /api/users/:userId/owned-cars/:carId
router.get('/:userId/owned-cars/:carId', async (req, res) => {
  try {
    const { userId, carId } = req.params;
    const car = await Car.findById(carId)
      .populate('user', 'name username profilePicture')
      .populate('owners');

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // Allow viewing the car details, but mark if user is an owner
    const isOwner = car.owners.some(owner =>
      owner._id && owner._id.toString() === userId
    );

    // Return car with isOwner flag
    res.json({
      ...car.toObject(),
      isOwner
    });

  } catch (error) {
    console.error('Error fetching car details:', error);
    console.error('Full error:', error.stack);
    res.status(500).json({ error: 'Failed to fetch car details', details: error.message });
  }
});

// POST /api/users/:userId/profile-picture
router.post('/:userId/profile-picture', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const sharp = require('sharp');

    // First get the user to find their current profile picture
    const currentUser = await User.findById(req.params.userId);
    const oldProfilePicture = currentUser?.profilePicture;

    const { x, y, width } = req.body;

    // Get image metadata first
    const metadata = await sharp(req.file.path).metadata();
    console.log('\nProfile Picture Upload Debug Info:');
    console.log('----------------------------------------');
    console.log('Image metadata:');
    console.log(`Original width: ${metadata.width}px`);
    console.log(`Original height: ${metadata.height}px`);
    console.log('----------------------------------------');
    console.log('Received crop values:');
    console.log(`X: ${x}`);
    console.log(`Y: ${y}`);
    console.log(`Width: ${width}`);
    console.log('----------------------------------------');

    // Validate and adjust crop values
    const cropX = Math.max(0, Math.min(parseInt(x), metadata.width - 1));
    const cropY = Math.max(0, Math.min(parseInt(y), metadata.height - 1));
    const maxSize = Math.min(
      metadata.width - cropX,
      metadata.height - cropY,
      parseInt(width)
    );
    const cropSize = Math.max(1, maxSize);

    console.log('Adjusted crop values:');
    console.log(`Crop X: ${cropX}`);
    console.log(`Crop Y: ${cropY}`);
    console.log(`Crop Size: ${cropSize}`);
    console.log('----------------------------------------');

    const fileName = `profile-${req.params.userId}-${Date.now()}.jpg`;
    const filePath = path.join(__dirname, '..', 'uploads', fileName);

    await fs.mkdir(path.join(__dirname, '..', 'uploads'), { recursive: true });

    // Process the image with validated values
    await sharp(req.file.path)
      .extract({
        left: cropX,
        top: cropY,
        width: cropSize,
        height: cropSize
      })
      .resize(300, 300, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 90 })
      .toFile(filePath);

    // Delete the temporary uploaded file
    await fs.unlink(req.file.path);

    // If there was an old profile picture, delete it
    if (oldProfilePicture) {
      const oldFilePath = path.join(__dirname, '..', oldProfilePicture.replace(/^\//, ''));
      try {
        await fs.unlink(oldFilePath);
        console.log('Deleted old profile picture:', oldFilePath);
      } catch (err) {
        // Don't throw if file doesn't exist
        console.log('Could not delete old profile picture:', err.message);
      }
    }

    console.log('Image processing complete');
    console.log(`Saved to: ${filePath}`);
    console.log('----------------------------------------\n');

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { profilePicture: `/uploads/${fileName}` },
      { new: true }
    )
      .select('-password')
      .populate('followers', '_id name username')
      .populate('following', '_id name username')
      .populate('ownedCars');

    res.json(user);
  } catch (error) {
    console.error('Profile picture upload error:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Failed to upload profile picture', details: error.message });
  }
});

// Add an admin-only route example
router.get('/all-users', isAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:userId/admin-check
router.get('/:userId/admin-check', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const adminRecord = await Admin.findOne({ userId: req.params.userId });
    res.json({ isAdmin: !!adminRecord });
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ isAdmin: false });
  }
});

// GET /api/users/admin/list
router.get('/admin/list', isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const pageSize = 10;

    const users = await User.aggregate([
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'userId',
          as: 'posts'
        }
      },
      {
        $project: {
          username: 1,
          name: 1,
          email: 1,
          createdAt: 1,
          bio: 1,
          profilePicture: 1,
          postCount: { $size: '$posts' },
          followerCount: { $size: '$followers' },
          followingCount: { $size: '$following' }
        }
      },
      { $sort: { createdAt: 1 } },
      { $skip: page * pageSize },
      { $limit: pageSize }
    ]);

    const total = await User.countDocuments();

    res.json({
      users,
      total,
      hasMore: (page + 1) * pageSize < total
    });
  } catch (error) {
    console.error('Error fetching users list:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:userId/posts/recent
router.get('/:userId/posts/recent', async (req, res) => {
  try {
    const recentPost = await Post.findOne({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name username profilePicture')
      .lean();

    if (!recentPost) {
      return res.json(null);
    }

    // Add empty likes array if undefined
    const postWithLikes = {
      ...recentPost,
      likes: recentPost.likes || []
    };

    res.json(postWithLikes);
  } catch (error) {
    console.error('Error fetching recent post:', error);
    res.status(500).json({ error: 'Failed to fetch recent post' });
  }
});

// POST /api/users/:userId/owned-cars/:carId/owners
router.post('/:userId/owned-cars/:carId/owners', async (req, res) => {
  try {
    const { userId, carId } = req.params;
    const { newOwnerId } = req.body;

    // Find the car and both users
    const [car, newOwner] = await Promise.all([
      Car.findById(carId),
      User.findById(newOwnerId)
    ]);

    if (!car || !newOwner) {
      return res.status(404).json({ error: 'Car or user not found' });
    }

    // Check if user is already an owner
    if (car.owners.includes(newOwnerId)) {
      return res.status(400).json({ error: 'User is already an owner of this car' });
    }

    // Add ownership records
    car.owners.push({
      _id: newOwnerId,
      name: newOwner.name,
      username: newOwner.username,
      joinedAt: new Date()
    });
    newOwner.ownedCars.push(carId);

    // Save both documents
    await Promise.all([
      car.save(),
      newOwner.save()
    ]);

    // Return updated car with populated owner info
    const updatedCar = await Car.findById(carId)
      .populate('user', 'name username profilePicture')
      .populate('owners');

    res.json(updatedCar);
  } catch (error) {
    console.error('Error adding car owner:', error);
    res.status(500).json({ error: 'Failed to add car owner' });
  }
});

// DELETE /api/users/:userId/owned-cars/:carId/owners/:ownerId
router.delete('/:userId/owned-cars/:carId/owners/:ownerId', async (req, res) => {
  try {
    const { userId, carId, ownerId } = req.params;

    const [car, owner] = await Promise.all([
      Car.findById(carId),
      User.findById(ownerId)
    ]);

    if (!car || !owner) {
      return res.status(404).json({ error: 'Car or user not found' });
    }

    // Remove ownership records
    car.owners = car.owners.filter(owner => owner._id.toString() !== ownerId);
    owner.ownedCars = owner.ownedCars.filter(id => id.toString() !== carId);

    if (car.owners.length === 0) {
      // If no owners left, delete the car
      await Car.findByIdAndDelete(carId);
    } else {
      await car.save();
    }

    await owner.save();

    res.json({ message: 'Ownership removed successfully' });
  } catch (error) {
    console.error('Error removing car owner:', error);
    res.status(500).json({ error: 'Failed to remove car owner' });
  }
});

module.exports = router; 