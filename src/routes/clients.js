import express from 'express';

export default function createClientRouter(models) {
  const router = express.Router();
  const { Client } = models;

  // Middleware: Only allow managers or admins
  function requireManagerOrAdmin(req, res, next) {
    if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Manager or admin access required' });
    }
    next();
  }

  // Add new client
  router.post('/', requireManagerOrAdmin, async (req, res) => {
    try {
      const { name, industry, contact_email } = req.body;
      const missing = [];
      if (!name) missing.push('name');
      if (!contact_email) missing.push('contact_email');
      if (missing.length) {
        return res.status(400).json({ error: 'Missing required fields', missing });
      }
      const client = await Client.create({ name, industry, contact_email });
      res.status(201).json(client);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // List all clients
  router.get('/', requireManagerOrAdmin, async (req, res) => {
    const clients = await Client.findAll();
    res.json(clients);
  });

  // Get client details
  router.get('/:id', requireManagerOrAdmin, async (req, res) => {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  });

  // Update client
  router.put('/:id', requireManagerOrAdmin, async (req, res) => {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    const { name, industry, contact_email } = req.body;
    if (name) client.name = name;
    if (industry) client.industry = industry;
    if (contact_email) client.contact_email = contact_email;
    await client.save();
    res.json(client);
  });

  // Delete client (cascade delete campaigns)
  router.delete('/:id', requireManagerOrAdmin, async (req, res) => {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    await client.destroy();
    res.json({ success: true });
  });

  return router;
}
