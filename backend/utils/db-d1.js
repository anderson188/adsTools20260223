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

        // 安全地添加过滤条件，避免undefined值
        if (filters.status && String(filters.status).trim() !== '') {
            query += ' AND status = ?';
            params.push(String(filters.status));
        }
        if (filters.affiliate_name && String(filters.affiliate_name).trim() !== '') {
            query += ' AND affiliate_name LIKE ?';
            params.push(`%${String(filters.affiliate_name).trim()}%`);
        }
        if (filters.campaign_name && String(filters.campaign_name).trim() !== '') {
            query += ' AND campaign_name LIKE ?';
            params.push(`%${String(filters.campaign_name).trim()}%`);
        }

        query += ' ORDER BY created_at DESC';
        
        // 在执行前检查params中是否有undefined值
        for (let i = 0; i < params.length; i++) {
            if (params[i] === undefined) {
                console.error(`Undefined parameter found at index ${i}`);
                throw new Error(`Query parameter at index ${i} is undefined`);
            }
        }
        
        const { results } = await this.db.prepare(query).bind(...params).all();
        return results || [];
    }

    async createAdLink(linkData) {
        // 严格验证所有必需字段，确保没有undefined值
        const validateField = (value, fieldName) => {
            if (value === undefined || value === null) {
                throw new Error(`Field '${fieldName}' cannot be undefined or null`);
            }
            return value;
        };
        
        // 确保所有值都是有效的基本类型，不是对象或undefined
        const sanitizeValue = (value) => {
            if (value === undefined || value === null) {
                return null;
            }
            // 如果是对象，转换为字符串或null
            if (typeof value === 'object') {
                return null;
            }
            // 确保是基本类型
            return value;
        };
        
        try {
            // 验证并清理所有字段
            const userId = validateField(linkData.userId, 'userId');
            const affiliateName = validateField(String(linkData.affiliateName), 'affiliateName');
            const affiliateLink = validateField(String(linkData.affiliateLink), 'affiliateLink');
            const mccAccountId = sanitizeValue(linkData.mccAccountId);
            const googleAdsAccountId = validateField(String(linkData.googleAdsAccountId), 'googleAdsAccountId');
            const campaignName = validateField(String(linkData.campaignName), 'campaignName');
            const landingDomain = validateField(String(linkData.landingDomain), 'landingDomain');
            
            // 处理数值字段
            let runFrequency = 60;
            if (linkData.runFrequency !== undefined && linkData.runFrequency !== null) {
                const parsed = parseInt(String(linkData.runFrequency));
                if (!isNaN(parsed) && parsed > 0) {
                    runFrequency = parsed;
                }
            }
            
            const referer = sanitizeValue(linkData.referer);
            const status = linkData.status || 'stopped';
            
            // 确保所有绑定值都不是undefined
            const bindValues = [
                userId,
                affiliateName,
                affiliateLink,
                mccAccountId,
                googleAdsAccountId,
                campaignName,
                landingDomain,
                runFrequency,
                referer,
                status
            ];
            
            // 最后检查：确保没有undefined值
            for (let i = 0; i < bindValues.length; i++) {
                if (bindValues[i] === undefined) {
                    throw new Error(`Bind value at position ${i} is undefined`);
                }
            }
            
            const { results } = await this.db.prepare(
                `INSERT INTO ad_links (user_id, affiliate_name, affiliate_link, mcc_account_id, 
                 google_ads_account_id, campaign_name, landing_domain, run_frequency, referer, status, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
            ).bind(...bindValues).run();

            // 获取刚插入的记录
            const { results: inserted } = await this.db.prepare(
                'SELECT * FROM ad_links WHERE id = ?'
            ).bind(results.lastInsertRowid).all();

            return inserted.length > 0 ? inserted[0] : { id: results.lastInsertRowid, ...linkData };
            
        } catch (error) {
            console.error('Error in createAdLink:', error);
            throw new Error('Failed to create ad link: ' + error.message);
        }
    }

    async updateAdLinkStatus(linkId, status, userId) {
        const { results } = await this.db.prepare(
            'UPDATE ad_links SET status = ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?'
        ).bind(status, linkId, userId).run();
        
        return results;
    }

    // 仪表板统计
    async getDashboardStats(userId) {
        const getCount = async (query, params = []) => {
            const result = await this.db.prepare(query).bind(...params).first();
            return result ? result.count || 0 : 0;
        };

        const totalLinks = await getCount('SELECT COUNT(*) as count FROM ad_links WHERE user_id = ?', [userId]);
        const runningLinks = await getCount('SELECT COUNT(*) as count FROM ad_links WHERE user_id = ? AND status = ?', [userId, 'running']);
        const stoppedLinks = await getCount('SELECT COUNT(*) as count FROM ad_links WHERE user_id = ? AND status = ?', [userId, 'stopped']);
        const totalRuns = await getCount('SELECT COUNT(*) as count FROM run_logs WHERE ad_link_id IN (SELECT id FROM ad_links WHERE user_id = ?)', [userId]);

        return {
            totalLinks,
            runningLinks,
            stoppedLinks,
            totalRuns
        };
    }

    // 域名相关操作
    async getActiveDomains() {
        const { results } = await this.db.prepare(
            'SELECT * FROM domain_pools WHERE status = ? ORDER BY usage_count ASC'
        ).bind('active').all();
        return results;
    }

    async updateDomainUsage(domainId) {
        await this.db.prepare(
            'UPDATE domain_pools SET usage_count = usage_count + 1, updated_at = datetime(\'now\') WHERE id = ?'
        ).bind(domainId).run();
    }

    // 创建新域名
    async createDomain(domainData) {
        const { results } = await this.db.prepare(
            `INSERT INTO domain_pools (domain, referer, status, created_at) 
             VALUES (?, ?, ?, datetime('now'))`
        ).bind(
            domainData.domain,
            domainData.referer || null,
            domainData.status || 'active'
        ).run();

        return results.lastInsertRowid;
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