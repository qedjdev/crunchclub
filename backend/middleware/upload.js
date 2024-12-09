const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// multer disk storage permanence
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    // yeah this is pretty stupid but it should be collision safe. if not, play the lottery
    crypto.randomBytes(16, (err, raw) => {
      if (err) return cb(err);

      cb(null, raw.toString('hex') + path.extname(file.originalname));
    });
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit because there are some big ass images out there and i have a 10tb drive
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      // ideally wont get here? frontend also protects
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

module.exports = upload; 