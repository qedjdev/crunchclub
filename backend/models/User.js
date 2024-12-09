const mongoose = require('mongoose');
const Counter = require('./Counter');

const userSchema = new mongoose.Schema({
  userId: { type: Number, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // troll ass unique: true here would be funny
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  bio: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  dreamCars: { type: Array, default: [] },
  // tracked in other collections
  ownedCars: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Car' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // this is the FILENAME we generate in upload middleware
  profilePicture: { type: String }
});

// tracking user count? probably not neede, may be deprecated TODO delete
userSchema.pre('save', async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      'userId',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.userId = counter.seq;
  }
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User; 