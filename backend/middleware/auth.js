const Admin = require('../models/Admin');

const isAdmin = async (req, res, next) => {
  try {
    const userId = req.query.userId || req.body.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required::No userId provided to isAdmin middleware' });
    }

    const adminRecord = await Admin.findOne({ userId });
    if (!adminRecord) {
      return res.status(403).json({ error: `Admin privileges required::No admin record found for userId:${userid} in isAdmin middleware` });
    }

    next();
  } catch (error) {
    console.error('Admin authorization error:', error);
    res.status(500).json({ error: 'Authorization failed: see node console for details' });
  }
};

module.exports = {
  isAdmin
};