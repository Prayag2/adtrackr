import express from 'express';
import bcrypt from 'bcryptjs';

export default function createUserRouter(models) {
  const router = express.Router();
  const { User } = models;

  // Middleware: Only allow admins (session-based)
  function requireAdmin(req, res, next) {
    // req.user is set from session in main app
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  }

  // Create new user
  router.post('/', requireAdmin, async (req, res) => {
    try {
      const { username, email, password, role } = req.body;
      const missing = [];
      if (!username) missing.push('username');
      if (!email) missing.push('email');
      if (!password) missing.push('password');
      if (!role) missing.push('role');
      if (missing.length) {
        return res.status(400).json({ error: 'Missing required fields', missing });
      }
      if (!['admin', 'manager'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      const password_hash = await bcrypt.hash(password, 10);
      const user = await User.create({ username, email, password_hash, role });
      res.status(201).json({ id: user.id, username: user.username, email: user.email, role: user.role });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // List all users
  router.get('/', requireAdmin, async (req, res) => {
    const users = await User.findAll({ attributes: { exclude: ['password_hash'] } });
    res.json(users);
  });

  // Get single user
  router.get('/:id', requireAdmin, async (req, res) => {
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password_hash'] } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });

  // Update user
  router.put('/:id', requireAdmin, async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { username, email, password, role } = req.body;
    if (role && !['admin', 'manager'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;
    if (password) user.password_hash = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ id: user.id, username: user.username, email: user.email, role: user.role });
  });

  // Delete user
  router.delete('/:id', requireAdmin, async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.destroy();
    res.json({ success: true });
  });

  return router;
}
