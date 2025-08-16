import { DataTypes } from 'sequelize';

export function defineModels(sequelize) {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    username: { type: DataTypes.STRING(100), unique: true, allowNull: false },
    email: { type: DataTypes.STRING(255), unique: true, allowNull: false },
    password_hash: { type: DataTypes.TEXT, allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'manager'), allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, { tableName: 'users', timestamps: false });

  const Client = sequelize.define('Client', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    industry: { type: DataTypes.STRING(255) },
    contact_email: { type: DataTypes.STRING(255), unique: true, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, { tableName: 'clients', timestamps: false });

  const Campaign = sequelize.define('Campaign', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    client_id: { type: DataTypes.INTEGER, allowNull: false },
    created_by: { type: DataTypes.INTEGER },
    campaign_name: { type: DataTypes.STRING(255), allowNull: false },
    budget: { type: DataTypes.DECIMAL(12,2), validate: { min: 0 } },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.ENUM('draft', 'active', 'paused', 'completed'), allowNull: false, defaultValue: 'draft' },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, { tableName: 'campaigns', timestamps: false });

  const Platform = sequelize.define('Platform', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), unique: true, allowNull: false },
  }, { tableName: 'platforms', timestamps: false });

  const CampaignPlatform = sequelize.define('CampaignPlatform', {
    campaign_id: { type: DataTypes.INTEGER, primaryKey: true },
    platform_id: { type: DataTypes.INTEGER, primaryKey: true },
  }, { tableName: 'campaign_platforms', timestamps: false });

  const Tag = sequelize.define('Tag', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), unique: true, allowNull: false },
  }, { tableName: 'tags', timestamps: false });

  const CampaignTag = sequelize.define('CampaignTag', {
    campaign_id: { type: DataTypes.INTEGER, primaryKey: true },
    tag_id: { type: DataTypes.INTEGER, primaryKey: true },
  }, { tableName: 'campaign_tags', timestamps: false });

  const PerformanceMetric = sequelize.define('PerformanceMetric', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    campaign_id: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    impressions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
    clicks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
    conversions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
    cost_per_click: { type: DataTypes.DECIMAL(10,4), allowNull: false, defaultValue: 0, validate: { min: 0 } },
    spend: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0, validate: { min: 0 } },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, { tableName: 'performance_metrics', timestamps: false, indexes: [
    { fields: ['campaign_id', 'date'], unique: true, name: 'idx_metrics_campaign_date' }
  ] });

  // Associations
  Client.hasMany(Campaign, { foreignKey: 'client_id' });
  Campaign.belongsTo(Client, { foreignKey: 'client_id' });
  User.hasMany(Campaign, { foreignKey: 'created_by' });
  Campaign.belongsTo(User, { foreignKey: 'created_by' });
  Campaign.belongsToMany(Platform, { through: CampaignPlatform, foreignKey: 'campaign_id', otherKey: 'platform_id' });
  Platform.belongsToMany(Campaign, { through: CampaignPlatform, foreignKey: 'platform_id', otherKey: 'campaign_id' });
  Campaign.belongsToMany(Tag, { through: CampaignTag, foreignKey: 'campaign_id', otherKey: 'tag_id' });
  Tag.belongsToMany(Campaign, { through: CampaignTag, foreignKey: 'tag_id', otherKey: 'campaign_id' });
  Campaign.hasMany(PerformanceMetric, { foreignKey: 'campaign_id' });
  PerformanceMetric.belongsTo(Campaign, { foreignKey: 'campaign_id' });

  return {
    User,
    Client,
    Campaign,
    Platform,
    CampaignPlatform,
    Tag,
    CampaignTag,
    PerformanceMetric,
  };
}
