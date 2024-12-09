const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// GET /api/data/uploads
router.get('/uploads', async (req, res) => {
  // this is probably really dangerous and i should look into it before going live on web... TODO filesystem safety crash course
  try {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    await fs.promises.mkdir(uploadsDir, { recursive: true });
    const files = await fs.promises.readdir(uploadsDir);

    const fileDetails = await Promise.all(files.map(async (filename) => {
      const filePath = path.join(uploadsDir, filename);
      const stats = await fs.promises.stat(filePath);
      return {
        name: filename,
        path: `/uploads/${filename}`,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    }));

    fileDetails.sort((a, b) => b.modified.getTime() - a.modified.getTime());
    res.json(fileDetails);
  } catch (error) {
    console.error('Error listing uploads:', error);
    res.status(500).json({ error: 'Failed to list uploads', details: error.message });
  }
});

module.exports = router; 