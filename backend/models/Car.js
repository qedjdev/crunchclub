const mongoose = require('mongoose');

// theres a couple different definitions for this stuff at this point. unifying would be nice TODO
const carSchema = new mongoose.Schema({
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  transmission: String,
  fuel_type: String,
  drive: String,
  cylinders: Number,
  owners: [{
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    username: String,
    joinedAt: { type: Date, default: Date.now }
  }],
  city_mpg: Number,
  combination_mpg: Number,
  highway_mpg: Number,
  class: String,
  image: { type: String, default: null },
  description: { type: String, default: "no description provided" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const Car = mongoose.model('Car', carSchema);
module.exports = Car; 