// Cloudflare Workers 主入口文件 - 简化版本（避免动态导入问题）

// 静态导入（避免动态导入导致的500错误）
const authRoutes = require('./api/auth');
const linksRoutes = require('./api/links');
const domainsRoutes = require('./api/domains');

// 简单的响应函数
function createResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

// 主请求处理器
async function handleRequest(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    console.log(`收到请求: ${request.method} ${path}`);

    // 根路径 - 用于调试
    if (path === '/') {
        return createResponse({
            success: true,
            message: 'API 服务运行正常',
            timestamp: new Date().toISOString(),
            availableEndpoints: [
                'POST /api/auth/login',
                'GET /api/auth/profile', 
                'GET /api/links',
                'POST /api/links',
                'PATCH /api/links/:id/status',
                'GET /api/dashboard/stats',
                'GET /api/domains'
            ]
        });
    }

    // API路由分发
    try {
        if (path === '/api/auth/login') {
            if (request.method === 'POST') {
                console.log('处理登录请求');
                return await authRoutes.login(request, env);
            }
        } else if (path === '/api/auth/profile') {
            if (request.method === 'GET') {
                console.log('处理profile请求');
                return await authRoutes.getProfile(request, env);
            }
        } else if (path === '/api/links') {
            if (request.method === 'GET') {
                console.log('处理获取链接列表请求');
                return await linksRoutes.getLinks(request, env);
            } else if (request.method === 'POST') {
                console.log('处理创建链接请求');
                return await linksRoutes.createLink(request, env);
            }
        } else if (path.startsWith('/api/links/')) {
            const linkId = path.split('/')[3];
            if (request.method === 'PATCH' && linkId) {
                console.log(`处理链接状态更新请求: ${linkId}`);
                return await linksRoutes.updateLinkStatus(request, env, linkId);
            }
        } else if (path === '/api/dashboard/stats') {
            if (request.method === 'GET') {
                console.log('处理仪表板统计请求');
                return await linksRoutes.getDashboardStats(request, env);
            }
        } else if (path === '/api/domains') {
            if (request.method === 'GET') {
                console.log('处理获取域名列表请求');
                return await domainsRoutes.getDomains(request, env);
            } else if (request.method === 'POST') {
                console.log('处理添加域名请求');
                return await domainsRoutes.addDomain(request, env);
            }
        }

        // 404处理
        console.log(`未找到接口: ${path}`);
        return createResponse({
            success: false,
            message: '接口不存在'
        }, 404);
        
    } catch (error) {
        console.error('请求处理错误:', error);
        return createResponse({
            success: false,
            message: '服务器内部错误',
            error: error.message
        }, 500);
    }
}

// 定时任务处理函数 - 简化版本（暂时返回成功）
async function handleScheduled(event, env, ctx) {
    console.log('定时任务执行 - 简化版本');
    return;
}

// Workers导出
export default {
    fetch: handleRequest,
    scheduled: handleScheduled
};