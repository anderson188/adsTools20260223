// 广告链接管理API路由
const DatabaseManager = require('../utils/db');

exports.getLinks = async (request, env) => {
    try {
        // 验证认证
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({
                success: false,
                message: '未提供有效的认证令牌'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.substring(7);
        const auth = new (require('../utils/auth'))(env.JWT_SECRET);
        const decoded = auth.verifyToken(token);

        const url = new URL(request.url);
        const filters = {
            status: url.searchParams.get('status'),
            affiliate_name: url.searchParams.get('affiliate_name'),
            campaign_name: url.searchParams.get('campaign_name')
        };

        const db = new DatabaseManager(env.DB);
        const links = await db.getAdLinksByUserId(decoded.userId, filters);

        return new Response(JSON.stringify({
            success: true,
            data: links
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get links error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '获取链接列表失败'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

exports.createLink = async (request, env) => {
    try {
        // 验证认证
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({
                success: false,
                message: '未提供有效的认证令牌'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.substring(7);
        const auth = new (require('../utils/auth'))(env.JWT_SECRET);
        const decoded = auth.verifyToken(token);

        const linkData = await request.json();
        
        // 验证必需字段
        const requiredFields = ['affiliate_name', 'affiliate_link', 'google_ads_account_id', 'campaign_name', 'landing_domain'];
        for (const field of requiredFields) {
            if (!linkData[field]) {
                return new Response(JSON.stringify({
                    success: false,
                    message: `缺少必需字段: ${field}`
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        const db = new DatabaseManager(env.DB);
        const link = await db.createAdLink({
            userId: decoded.userId,
            affiliateName: linkData.affiliate_name,
            affiliateLink: linkData.affiliate_link,
            mccAccountId: linkData.mcc_account_id,
            googleAdsAccountId: linkData.google_ads_account_id,
            campaignName: linkData.campaign_name,
            landingDomain: linkData.landing_domain,
            runFrequency: linkData.run_frequency || 60,
            referer: linkData.referer,
            status: linkData.status || 'stopped'
        });

        return new Response(JSON.stringify({
            success: true,
            message: '广告链接创建成功',
            data: link
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Create link error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '创建广告链接失败'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

exports.updateLinkStatus = async (request, env, linkId) => {
    try {
        // 验证认证
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({
                success: false,
                message: '未提供有效的认证令牌'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.substring(7);
        const auth = new (require('../utils/auth'))(env.JWT_SECRET);
        const decoded = auth.verifyToken(token);

        const { status } = await request.json();
        if (!status || !['running', 'stopped'].includes(status)) {
            return new Response(JSON.stringify({
                success: false,
                message: '无效的状态值'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const db = new DatabaseManager(env.DB);
        const result = await db.updateAdLinkStatus(parseInt(linkId), status, decoded.userId);

        if (result.affectedRows === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: '链接不存在或无权限操作'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            message: `链接已${status === 'running' ? '启动' : '停止'}`,
            data: result
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Update link status error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '更新链接状态失败'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

exports.getDashboardStats = async (request, env) => {
    try {
        // 验证认证
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({
                success: false,
                message: '未提供有效的认证令牌'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.substring(7);
        const auth = new (require('../utils/auth'))(env.JWT_SECRET);
        const decoded = auth.verifyToken(token);

        const db = new DatabaseManager(env.DB);
        const stats = await db.getDashboardStats(decoded.userId);

        return new Response(JSON.stringify({
            success: true,
            data: stats
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get dashboard stats error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '获取统计数据失败'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};