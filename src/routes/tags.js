import express from 'express';

export default function createTagRouter(models) {
  const router = express.Router();
  const { Tag } = models;

  // Middleware: Only allow managers or admins
  function requireManagerOrAdmin(req, res, next) {
    if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Manager or admin access required' });
    }
    next();
  }

  // Add new tag
  router.post('/', requireManagerOrAdmin, async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing required fields', missing: ['name'] });
    try {
      const tag = await Tag.create({ name });
      res.status(201).json(tag);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // List all tags
  router.get('/', requireManagerOrAdmin, async (req, res) => {
    const tags = await Tag.findAll();
    res.json(tags);
  });

  // Delete a tag
  router.delete('/:id', requireManagerOrAdmin, async (req, res) => {
    const tag = await Tag.findByPk(req.params.id);
    if (!tag) return res.status(404).json({ error: 'Tag not found' });
    await tag.destroy();
    res.json({ success: true });
  });

  return router;
}
