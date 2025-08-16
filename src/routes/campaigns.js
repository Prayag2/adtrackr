import express from 'express';

export default function createCampaignRouter(models) {
  const router = express.Router();
  const { Campaign, Client, Platform, Tag } = models;

  // Middleware: Only allow managers or admins
  function requireManagerOrAdmin(req, res, next) {
    if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Manager or admin access required' });
    }
    next();
  }

  // Helper: fetch platforms and tags for a campaign
  async function getCampaignWithAssociations(campaign) {
    const platforms = await campaign.getPlatforms();
    const tags = await campaign.getTags();
    const client = await campaign.getClient();
    return {
      ...campaign.toJSON(),
      platforms: platforms.map(p => p.name),
      tags: tags.map(t => t.name),
      client: client ? { id: client.id, name: client.name } : null,
    };
  }

  // Create a new campaign
  router.post('/', requireManagerOrAdmin, async (req, res) => {
    try {
      const { client_id, created_by, campaign_name, budget, start_date, end_date, status, platform_ids, tag_ids } = req.body;
      const missing = [];
      if (!client_id) missing.push('client_id');
      if (!campaign_name) missing.push('campaign_name');
      if (!start_date) missing.push('start_date');
      if (!end_date) missing.push('end_date');
      if (missing.length) {
        return res.status(400).json({ error: 'Missing required fields', missing });
      }
      const campaign = await Campaign.create({ client_id, created_by, campaign_name, budget, start_date, end_date, status });
      if (platform_ids) await campaign.setPlatforms(platform_ids);
      if (tag_ids) await campaign.setTags(tag_ids);
      const result = await getCampaignWithAssociations(campaign);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // List all campaigns (with platforms, tags, client)
  router.get('/', requireManagerOrAdmin, async (req, res) => {
    const campaigns = await Campaign.findAll();
    const results = await Promise.all(campaigns.map(getCampaignWithAssociations));
    res.json(results);
  });

  // Get single campaign (with platforms, tags, client)
  router.get('/:id', requireManagerOrAdmin, async (req, res) => {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    const result = await getCampaignWithAssociations(campaign);
    res.json(result);
  });

  // Update campaign
  router.put('/:id', requireManagerOrAdmin, async (req, res) => {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    const { client_id, created_by, campaign_name, budget, start_date, end_date, status, platform_ids, tag_ids } = req.body;
    if (client_id) campaign.client_id = client_id;
    if (created_by) campaign.created_by = created_by;
    if (campaign_name) campaign.campaign_name = campaign_name;
    if (budget !== undefined) campaign.budget = budget;
    if (start_date) campaign.start_date = start_date;
    if (end_date) campaign.end_date = end_date;
    if (status) campaign.status = status;
    await campaign.save();
    if (platform_ids) await campaign.setPlatforms(platform_ids);
    if (tag_ids) await campaign.setTags(tag_ids);
    const result = await getCampaignWithAssociations(campaign);
    res.json(result);
  });

  // Delete campaign (cascade delete metrics)
  router.delete('/:id', requireManagerOrAdmin, async (req, res) => {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    await campaign.destroy();
    res.json({ success: true });
  });

  return router;
}
