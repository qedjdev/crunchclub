const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  // poster
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  isFollowersOnly: { type: Boolean, default: false },
  // list of likes, userids
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post; 