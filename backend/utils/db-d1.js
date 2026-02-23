// 数据库操作工具类 - Cloudflare D1 原生API
// 替换原有的sqlite3版本，适配Cloudflare Workers环境
export default class DatabaseManager {
    constructor(db) {
        this.db = db;
    }

    // 用户相关操作
    async getUserByUsername(username) {
        const { results } = await this.db.prepare(
            'SELECT * FROM users WHERE username = ? AND status = ?'
        ).bind(username, 'active').all();
        return results.length > 0 ? results[0] : null;
    }

    async getUserRoles(userId) {
        const { results } = await this.db.prepare(
            `SELECT r.* FROM user_roles ur 
             JOIN roles r ON ur.role_id = r.id 
             WHERE ur.user_id = ?`
        ).bind(userId).all();
        return results;
    }

    async getUserMenus(userId) {
        const { results } = await this.db.prepare(
            `SELECT DISTINCT m.* FROM menus m 
             JOIN role_menus rm ON m.id = rm.menu_id 
             JOIN user_roles ur ON rm.role_id = ur.role_id 
             WHERE ur.user_id = ? AND m.status = ? 
             ORDER BY m.sort_order`
        ).bind(userId, 'active').all();
        return results;
    }

    // 广告链接相关操作
    async getAdLinksByUserId(userId, filters = {}) {
        let query = 'SELECT * FROM ad_links WHERE user_id = ?';
        const params = [userId];

        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }
        if (filters.affiliate_name) {
            query += ' AND affiliate_name LIKE ?';
            params.push(`%${filters.affiliate_name}%`);
        }
        if (filters.campaign_name) {
            query += ' AND campaign_name LIKE ?';
            params.push(`%${filters.campaign_name}%`);
        }

        query += ' ORDER BY created_at DESC';
        
        const { results } = await this.db.prepare(query).bind(...params).all();
        return results;
    }

    async createAdLink(linkData) {
        const { results } = await this.db.prepare(
            `INSERT INTO ad_links (user_id, affiliate_name, affiliate_link, mcc_account_id, 
             google_ads_account_id, campaign_name, landing_domain, run_frequency, referer, status, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
        ).bind(
            linkData.userId,
            linkData.affiliateName,
            linkData.affiliateLink,
            linkData.mccAccountId,
            linkData.googleAdsAccountId,
            linkData.campaignName,
            linkData.landingDomain,
            linkData.runFrequency,
            linkData.referer,
            linkData.status
        ).run();

        // 获取刚插入的记录
        const { results: inserted } = await this.db.prepare(
            'SELECT * FROM ad_links WHERE id = ?'
        ).bind(results.lastInsertRowid).all();

        return inserted.length > 0 ? inserted[0] : { id: results.lastInsertRowid, ...linkData };
    }

    async updateAdLinkStatus(linkId, status, userId) {
        const { results } = await this.db.prepare(
            'UPDATE ad_links SET status = ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?'
        ).bind(status, linkId, userId).run();
        
        return results;
    }

    // 仪表板统计
    async getDashboardStats(userId) {
        const totalLinks = await this.db.prepare(
            'SELECT COUNT(*) as count FROM ad_links WHERE user_id = ?'
        ).bind(userId).first();

        const runningLinks = await this.db.prepare(
            'SELECT COUNT(*) as count FROM ad_links WHERE user_id = ? AND status = ?'
        ).bind(userId, 'running').first();

        const stoppedLinks = await this.db.prepare(
            'SELECT COUNT(*) as count FROM ad_links WHERE user_id = ? AND status = ?'
        ).bind(userId, 'stopped').first();

        const totalRuns = await this.db.prepare(
            'SELECT COUNT(*) as count FROM run_logs WHERE ad_link_id IN (SELECT id FROM ad_links WHERE user_id = ?)'
        ).bind(userId).first();

        return {
            totalLinks: totalLinks.count || 0,
            runningLinks: runningLinks.count || 0,
            stoppedLinks: stoppedLinks.count || 0,
            totalRuns: totalRuns.count || 0
        };
    }

    // 域名相关操作
    async getActiveDomains() {
        const { results } = await this.db.prepare(
            'SELECT * FROM domains WHERE status = ? ORDER BY usage_count ASC'
        ).bind('active').all();
        return results;
    }

    async updateDomainUsage(domainId) {
        await this.db.prepare(
            'UPDATE domains SET usage_count = usage_count + 1, updated_at = datetime(\'now\') WHERE id = ?'
        ).bind(domainId).run();
    }

    // 运行日志
    async createRunLog(logData) {
        await this.db.prepare(
            `INSERT INTO run_logs (ad_link_id, status, message, old_tracking_template, new_tracking_template, created_at) 
             VALUES (?, ?, ?, ?, ?, datetime('now'))`
        ).bind(
            logData.adLinkId,
            logData.status,
            logData.message,
            logData.oldTrackingTemplate,
            logData.newTrackingTemplate
        ).run();
    }
}