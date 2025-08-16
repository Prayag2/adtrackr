import express from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { Parser as CsvParser } from 'json2csv';

export default function createReportsRouter(models) {
  const router = express.Router();
  const { PerformanceMetric, Campaign, Client } = models;

  function requireManagerOrAdmin(req, res, next) {
    if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Manager or admin access required' });
    }
    next();
  }

  // GET /reports/top-campaigns?by=ctr|conversions&limit=5&from=&to=
  router.get('/top-campaigns', requireManagerOrAdmin, async (req, res) => {
    const { by = 'ctr', limit = 5, from, to } = req.query;
    const where = {};
    if (from || to) {
      where.date = {};
      if (from) where.date[Op.gte] = from;
      if (to) where.date[Op.lte] = to;
    }
    let order, attributes;
    // Always include conversions, spend, and cost_per_click in the output
    attributes = [
      'campaign_id',
      [fn('SUM', col('clicks')), 'total_clicks'],
      [fn('SUM', col('impressions')), 'total_impressions'],
      [fn('SUM', col('conversions')), 'total_conversions'],
      [fn('SUM', col('spend')), 'total_spend'],
      [fn('AVG', col('cost_per_click')), 'avg_cpc'],
    ];
    if (by === 'conversions') {
      order = [[literal('total_conversions'), 'DESC']];
    } else {
      // Default: by CTR (clicks/impressions)
      attributes.push([literal('CASE WHEN SUM(impressions) > 0 THEN SUM(clicks)::float/SUM(impressions) ELSE 0 END'), 'ctr']);
      order = [[literal('ctr'), 'DESC']];
    }
    const metrics = await PerformanceMetric.findAll({
      where,
      attributes,
      group: ['campaign_id'],
      order,
      limit: parseInt(limit, 10),
      raw: true,
    });
    // Attach campaign info
    const campaignIds = metrics.map(m => m.campaign_id);
    const campaigns = await Campaign.findAll({ where: { id: campaignIds }, raw: true });
    res.json(metrics.map(m => ({
      total_clicks: Number(m.total_clicks),
      total_impressions: Number(m.total_impressions),
      total_conversions: Number(m.total_conversions),
      total_spend: Number(m.total_spend),
      average_cpc: Number(m.avg_cpc),
      ctr: m.total_impressions > 0 ? Number(m.total_clicks) / Number(m.total_impressions) : 0,
      campaign: campaigns.find(c => c.id === m.campaign_id) || null,
    })));
  });

  // GET /reports/summary?clientId=&from=&to=
  router.get('/summary', requireManagerOrAdmin, async (req, res) => {
    const { clientId, from, to } = req.query;
    const where = {};
    if (from || to) {
      where.date = {};
      if (from) where.date[Op.gte] = from;
      if (to) where.date[Op.lte] = to;
    }
    if (clientId) {
      // Get campaign IDs for this client
      const campaigns = await Campaign.findAll({ where: { client_id: clientId }, attributes: ['id'], raw: true });
      where.campaign_id = campaigns.map(c => c.id);
    }
    const result = await PerformanceMetric.findAll({
      where,
      attributes: [
        [fn('SUM', col('impressions')), 'total_impressions'],
        [fn('SUM', col('clicks')), 'total_clicks'],
        [fn('SUM', col('conversions')), 'total_conversions'],
        [fn('SUM', col('spend')), 'total_spend'],
        [fn('AVG', col('cost_per_click')), 'avg_cpc'],
        [fn('AVG', col('impressions')), 'avg_impressions'],
        [fn('AVG', col('clicks')), 'avg_clicks'],
        [fn('AVG', col('conversions')), 'avg_conversions'],
        [fn('AVG', col('spend')), 'avg_spend'],
      ],
      raw: true,
    });
    const summary = result[0];
    // Calculate CTR and CPC
    summary.ctr = summary.total_impressions > 0 ? summary.total_clicks / summary.total_impressions : 0;
    summary.cpc = summary.total_clicks > 0 ? summary.total_spend / summary.total_clicks : 0;
    res.json(summary);
  });

  // GET /reports/export?campaignId=&from=&to=
  router.get('/export', requireManagerOrAdmin, async (req, res) => {
    const { campaignId, from, to } = req.query;
    const where = {};
    if (campaignId) where.campaign_id = campaignId;
    if (from || to) {
      where.date = {};
      if (from) where.date[Op.gte] = from;
      if (to) where.date[Op.lte] = to;
    }
    const metrics = await PerformanceMetric.findAll({
      where,
      order: [['date', 'ASC']],
      raw: true,
    });
    const fields = [
      { label: 'date', value: 'date' },
      { label: 'impressions', value: 'impressions' },
      { label: 'clicks', value: 'clicks' },
      { label: 'conversions', value: 'conversions' },
      { label: 'cpc', value: 'cost_per_click' },
      { label: 'spend', value: 'spend' },
    ];
    const parser = new CsvParser({ fields });
    const csv = parser.parse(metrics);
    res.header('Content-Type', 'text/csv');
    res.attachment('metrics.csv');
    res.send(csv);
  });

  return router;
}
