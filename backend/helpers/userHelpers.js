const User = require('../models/User');

async function generateUsername(name, email) {
  const nameParts = name.trim().split(' ');
  let username = '';

  if (nameParts.length >= 2) {
    // Ben Wakefield ->  benw
    username = (nameParts[0] + nameParts[nameParts.length - 1][0]).toLowerCase();

    // dont add if exists
    const existingUser = await User.findOne({ username });
    if (!existingUser) {
      return username;
    }
  }

  // alternate email based username
  username = email.replace('@', '_').toLowerCase();

  // shouldnt fail but ah what the hell
  const existingUser = await User.findOne({ username });
  if (!existingUser) {
    return username;
  }

  // im a gambling man. no, this is TECHNICALLY not safe.
  const randomNum = Math.floor(Math.random() * 10000);
  return `${username}_${randomNum}`;
}

module.exports = {
  generateUsername
}; 