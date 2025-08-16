
import express from 'express';
import { Sequelize } from 'sequelize';
import { defineModels } from './models.js';

const app = express();
const port = process.env.PORT || 3000;


// Update these values as needed
const sequelize = new Sequelize('postgres://prayag:password@localhost:5432/digivantrix');

const models = defineModels(sequelize);

import createUserRouter from './routes/users.js';
import createClientRouter from './routes/clients.js';
import configureSession from './session.js';
import createPlatformRouter from './routes/platforms.js';


// Middleware: parse JSON
app.use(express.json());

// Session middleware (PostgreSQL-backed)
configureSession(app);

// Auth endpoints
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
  const user = await models.User.findOne({ where: { username } });
  if (!user) return res.status(401).json({ error: 'Invalid username or password' });
  const bcrypt = await import('bcryptjs');
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid username or password' });
  req.session.user = { id: user.id, role: user.role, username: user.username };
  res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Attach req.user from session
app.use((req, res, next) => {
  req.user = req.session.user || null;
  next();
});


// User management endpoints
app.use('/users', createUserRouter(models));


// Client management endpoints
app.use('/clients', createClientRouter(models));


// Platform management endpoints
app.use('/platforms', createPlatformRouter(models));


// Campaign management endpoints
import createCampaignRouter from './routes/campaigns.js';
app.use('/campaigns', createCampaignRouter(models));


// Tag management endpoints
import createTagRouter from './routes/tags.js';
app.use('/tags', createTagRouter(models));


// Metrics management endpoints
import createMetricsRouter from './routes/metrics.js';
app.use('/metrics', createMetricsRouter({ ...models, sequelize }));

// Reports endpoints
import createReportsRouter from './routes/reports.js';
app.use('/reports', createReportsRouter({ ...models, sequelize }));


app.get('/', (req, res) => {
  res.send('Hello, world!');
});


// Sync models and start server
(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // { force: true } for dev reset
    console.log('Connection to PostgreSQL has been established successfully.');
    app.listen(port, () => {
      console.log(`Server listening at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
})();
