
import express from 'express';
import multer from 'multer';
import csvParser from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { Op } from 'sequelize';

export default function createMetricsRouter(models) {
  const router = express.Router();
  const { PerformanceMetric } = models;

  // Middleware: Only allow managers or admins
  function requireManagerOrAdmin(req, res, next) {
    if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Manager or admin access required' });
    }
    next();
  }

  // Multer setup for temp file upload
  const upload = multer({ dest: 'tmp/' });

  // POST /metrics/upload-csv
  router.post('/upload-csv', requireManagerOrAdmin, upload.single('file'), async (req, res) => {
    const { campaign_id } = req.body;
    if (!campaign_id) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Missing required fields', missing: ['campaign_id'] });
    }
    if (!req.file) return res.status(400).json({ error: 'Missing required fields', missing: ['file'] });
    const filePath = req.file.path;
    const metrics = [];
    let errorRows = [];
    try {
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on('data', (row) => {
            // Validate row
            const missing = [];
            ['date','impressions','clicks','conversions','cost_per_click','spend'].forEach(f => { if (!(f in row)) missing.push(f); });
            if (missing.length) {
              errorRows.push({ row, error: 'Missing fields', missing });
              return;
            }
            metrics.push({
              campaign_id,
              date: row.date,
              impressions: parseInt(row.impressions, 10),
              clicks: parseInt(row.clicks, 10),
              conversions: parseInt(row.conversions, 10),
              cost_per_click: parseFloat(row.cost_per_click),
              spend: parseFloat(row.spend),
            });
          })
          .on('end', resolve)
          .on('error', reject);
      });
      // Insert in transaction
      await models.sequelize.transaction(async (t) => {
        for (const metric of metrics) {
          await PerformanceMetric.create(metric, { transaction: t });
        }
      });
      res.json({ success: true, inserted: metrics.length, errors: errorRows });
    } catch (err) {
      res.status(400).json({ error: err.message, errors: errorRows });
    } finally {
      fs.unlinkSync(filePath);
    }
  });

  // GET /metrics (filters: campaignId, from, to; pagination)
  router.get('/', requireManagerOrAdmin, async (req, res) => {
    const { campaignId, from, to, page = 1, pageSize = 20 } = req.query;
    const where = {};
    if (campaignId) where.campaign_id = campaignId;
    if (from || to) {
      where.date = {};
      if (from) where.date[Op.gte] = from;
      if (to) where.date[Op.lte] = to;
    }
    const offset = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);
    const { count, rows } = await PerformanceMetric.findAndCountAll({
      where,
      offset,
      limit: parseInt(pageSize, 10),
      order: [['date', 'DESC']],
    });
    res.json({ total: count, page: parseInt(page, 10), pageSize: parseInt(pageSize, 10), data: rows });
  });

  // GET /metrics/:id
  router.get('/:id', requireManagerOrAdmin, async (req, res) => {
    const metric = await PerformanceMetric.findByPk(req.params.id);
    if (!metric) return res.status(404).json({ error: 'Metric not found' });
    res.json(metric);
  });

  // PUT /metrics/:id
  router.put('/:id', requireManagerOrAdmin, async (req, res) => {
    const metric = await PerformanceMetric.findByPk(req.params.id);
    if (!metric) return res.status(404).json({ error: 'Metric not found' });
    const fields = ['date','impressions','clicks','conversions','cost_per_click','spend'];
    for (const f of fields) {
      if (req.body[f] !== undefined) metric[f] = req.body[f];
    }
    await metric.save();
    res.json(metric);
  });

  // DELETE /metrics/:id
  router.delete('/:id', requireManagerOrAdmin, async (req, res) => {
    const metric = await PerformanceMetric.findByPk(req.params.id);
    if (!metric) return res.status(404).json({ error: 'Metric not found' });
    await metric.destroy();
    res.json({ success: true });
  });

  return router;
}
