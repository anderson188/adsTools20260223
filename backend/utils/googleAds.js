// Google Ads API 集成工具类
const { GoogleAdsApi } = require('google-ads-api');

class GoogleAdsManager {
    constructor(config) {
        this.client = new GoogleAdsApi({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            developer_token: config.developerToken
        });
        this.refreshToken = config.refreshToken;
    }

    // 创建客户实例
    getCustomer(customerId) {
        return this.client.Customer({
            customer_id: customerId,
            refresh_token: this.refreshToken
        });
    }

    // 更新广告系列追踪模板
    async updateCampaignTrackingTemplate(customerId, campaignName, trackingTemplate) {
        try {
            const customer = this.getCustomer(customerId);
            
            // 搜索指定的广告系列
            const campaigns = await customer.query(`
                SELECT 
                    campaign.id, 
                    campaign.name, 
                    campaign.tracking_url_template 
                FROM campaign 
                WHERE campaign.name = '${campaignName}'
            `);

            if (campaigns.length === 0) {
                throw new Error(`Campaign '${campaignName}' not found`);
            }

            const campaign = campaigns[0];
            const oldTemplate = campaign.campaign.tracking_url_template;

            // 更新追踪模板
            await customer.mutateResources(
                'campaign',
                [{
                    resource_name: campaign.campaign.resource_name,
                    tracking_url_template: trackingTemplate
                }],
                'update'
            );

            return {
                success: true,
                campaignId: campaign.campaign.id,
                oldTemplate,
                newTemplate: trackingTemplate,
                message: `Successfully updated tracking template for campaign ${campaignName}`
            };

        } catch (error) {
            console.error('Google Ads API Error:', error);
            return {
                success: false,
                error: error.message,
                message: `Failed to update campaign ${campaignName}: ${error.message}`
            };
        }
    }

    // 批量更新多个广告系列
    async batchUpdateCampaigns(updates) {
        const results = [];
        
        for (const update of updates) {
            const result = await this.updateCampaignTrackingTemplate(
                update.customerId,
                update.campaignName,
                update.trackingTemplate
            );
            results.push({
                ...result,
                campaignName: update.campaignName
            });
        }

        return results;
    }

    // 构建追踪模板URL
    buildTrackingTemplate(workerDomain, targetUrl, newDomain) {
        // 注意：这里需要根据实际需求调整URL格式
        return `https://${workerDomain}/?target=${encodeURIComponent(targetUrl)}&new_domain=${encodeURIComponent(newDomain)}`;
    }
}

module.exports = GoogleAdsManager;