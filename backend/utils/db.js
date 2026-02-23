// 数据库操作工具类 - Cloudflare D1
const sqlite3 = require('sqlite3').verbose();

class DatabaseManager {
    constructor(db) {
        this.db = db;
    }

    // 用户相关操作
    async getUserByUsername(username) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM users WHERE username = ? AND status = "active"',
                [username],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async createUser(userData) {
        const { username, email, passwordHash } = userData;
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                [username, email, passwordHash],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, ...userData });
                }
            );
        });
    }

    // 用户角色权限相关
    async getUserRoles(userId) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT r.id, r.name, r.description 
                FROM roles r 
                JOIN user_roles ur ON r.id = ur.role_id 
                WHERE ur.user_id = ?
            `, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async getUserMenus(userId) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT DISTINCT m.* 
                FROM menus m 
                JOIN role_menus rm ON m.id = rm.menu_id 
                JOIN user_roles ur ON rm.role_id = ur.role_id 
                WHERE ur.user_id = ? 
                ORDER BY m.sort_order, m.id
            `, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // 广告链接相关操作
    async getAdLinksByUserId(userId, filters = {}) {
        let query = 'SELECT * FROM ad_links WHERE user_id = ?';
        let params = [userId];

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

        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async createAdLink(linkData) {
        const {
            userId, affiliateName, affiliateLink, mccAccountId, googleAdsAccountId,
            campaignName, landingDomain, runFrequency, referer, status
        } = linkData;

        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO ad_links 
                (user_id, affiliate_name, affiliate_link, mcc_account_id, google_ads_account_id,
                 campaign_name, landing_domain, run_frequency, referer, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                userId, affiliateName, affiliateLink, mccAccountId, googleAdsAccountId,
                campaignName, landingDomain, runFrequency, referer, status || 'stopped'
            ], function(err) {
                if (err) reject(err);
                else resolve({
                    id: this.lastID,
                    ...linkData,
                    user_id: userId
                });
            });
        });
    }

    async updateAdLinkStatus(id, status, userId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE ad_links SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
                [status, id, userId],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id, status, affectedRows: this.changes });
                }
            );
        });
    }

    // 域名池相关操作
    async getActiveDomains() {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM domain_pools WHERE status = "active" ORDER BY usage_count ASC, last_used_at ASC',
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    async updateDomainUsage(domainId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE domain_pools SET usage_count = usage_count + 1, last_used_at = CURRENT_TIMESTAMP WHERE id = ?',
                [domainId],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: domainId, affectedRows: this.changes });
                }
            );
        });
    }

    // 日志相关操作
    async createRunLog(logData) {
        const {
            adLinkId, status, message, oldTrackingTemplate, newTrackingTemplate
        } = logData;

        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO run_logs 
                (ad_link_id, status, message, old_tracking_template, new_tracking_template)
                VALUES (?, ?, ?, ?, ?)
            `, [adLinkId, status, message, oldTrackingTemplate, newTrackingTemplate],
            function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, ...logData });
            });
        });
    }

    async getDashboardStats(userId) {
        return new Promise((resolve, reject) => {
            const stats = {};
            
            // 并行查询各种统计数据
            Promise.all([
                new Promise(res => {
                    this.db.get('SELECT COUNT(*) as total FROM ad_links WHERE user_id = ?', [userId], (err, row) => {
                        stats.totalLinks = row ? row.total : 0;
                        res();
                    });
                }),
                new Promise(res => {
                    this.db.get('SELECT COUNT(*) as running FROM ad_links WHERE user_id = ? AND status = "running"', [userId], (err, row) => {
                        stats.runningLinks = row ? row.running : 0;
                        res();
                    });
                }),
                new Promise(res => {
                    this.db.get('SELECT COUNT(*) as stopped FROM ad_links WHERE user_id = ? AND status = "stopped"', [userId], (err, row) => {
                        stats.stoppedLinks = row ? row.stopped : 0;
                        res();
                    });
                }),
                new Promise(res => {
                    this.db.get('SELECT COUNT(*) as total FROM run_logs WHERE ad_link_id IN (SELECT id FROM ad_links WHERE user_id = ?)', [userId], (err, row) => {
                        stats.totalRuns = row ? row.total : 0;
                        res();
                    });
                })
            ]).then(() => resolve(stats));
        });
    }
}

module.exports = DatabaseManager;