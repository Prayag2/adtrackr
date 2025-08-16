import express from 'express';

export default function createPlatformRouter(models) {
  const router = express.Router();
  const { Platform } = models;

  // Middleware: Only allow managers or admins
  function requireManagerOrAdmin(req, res, next) {
    if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Manager or admin access required' });
    }
    next();
  }

  // Add new platform
  router.post('/', requireManagerOrAdmin, async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: 'Missing required fields', missing: ['name'] });
      const platform = await Platform.create({ name });
      res.status(201).json(platform);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // List all platforms
  router.get('/', requireManagerOrAdmin, async (req, res) => {
    const platforms = await Platform.findAll();
    res.json(platforms);
  });

  // Delete a platform
  router.delete('/:id', requireManagerOrAdmin, async (req, res) => {
    const platform = await Platform.findByPk(req.params.id);
    if (!platform) return res.status(404).json({ error: 'Platform not found' });
    await platform.destroy();
    res.json({ success: true });
  });

  return router;
}
