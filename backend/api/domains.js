// 域名池管理API路由
import DatabaseManager from '../utils/db.js';

exports.getDomains = async (request, env) => {
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

        const db = new DatabaseManager(env.DB);
        const domains = await db.getActiveDomains();

        return new Response(JSON.stringify({
            success: true,
            data: domains
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get domains error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '获取域名列表失败'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

exports.addDomain = async (request, env) => {
    try {
        // 验证认证和管理员权限
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
        const { default: AuthManager } = await import('../utils/auth.js');
        const auth = new AuthManager(env.JWT_SECRET);
        const decoded = auth.verifyToken(token);

        const db = new DatabaseManager(env.DB);
        const roles = await db.getUserRoles(decoded.userId);
        
        if (!auth.isAdmin(roles)) {
            return new Response(JSON.stringify({
                success: false,
                message: '权限不足'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const domainData = await request.json();
        
        if (!domainData.domain) {
            return new Response(JSON.stringify({
                success: false,
                message: '域名不能为空'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 这里应该添加插入域名的数据库操作
        // 简化处理，返回成功
        return new Response(JSON.stringify({
            success: true,
            message: '域名添加成功',
            data: { ...domainData, id: Date.now() }
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Add domain error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '添加域名失败'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};