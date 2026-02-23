// Cloudflare Workers 主入口文件 - 修复版本
// 临时模拟版本，绕过数据库依赖

// CORS 中间件函数
function addCorsHeaders(response, origin = '*') {
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.set('Access-Control-Max-Age', '86400');
    
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
    });
}

// 处理预检请求
function handleOptions(request) {
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.set('Access-Control-Max-Age', '86400');
    
    return new Response(null, { headers });
}

// 主请求处理器
async function handleRequest(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
        return handleOptions(request);
    }
    
    let response;
    
    // 直接处理API路由，不依赖外部模块
    if (path === '/api/auth/login' && request.method === 'POST') {
        try {
            const { username, password } = await request.json();
            
            if (!username || !password) {
                response = new Response(JSON.stringify({
                    success: false,
                    message: '用户名和密码不能为空'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            } else if (username === 'admin' && password === 'admin123') {
                response = new Response(JSON.stringify({
                    success: true,
                    message: '登录成功',
                    data: {
                        token: 'mock-jwt-token-' + Date.now(),
                        user: {
                            id: 1,
                            username: 'admin',
                            email: 'admin@example.com'
                        },
                        roles: [{ id: 1, name: 'admin' }],
                        menus: [
                            { id: 1, name: '仪表板', path: '/dashboard', icon: 'tachometer-alt' },
                            { id: 2, name: '广告链接', path: '/links', icon: 'link' },
                            { id: 3, name: '域名管理', path: '/domains', icon: 'globe' }
                        ]
                    }
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            } else {
                response = new Response(JSON.stringify({
                    success: false,
                    message: '用户名或密码错误'
                }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        } catch (error) {
            response = new Response(JSON.stringify({
                success: false,
                message: '服务器内部错误'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } else if (path === '/api/auth/profile' && request.method === 'GET') {
        // 临时模拟profile响应
        response = new Response(JSON.stringify({
            success: true,
            data: {
                user: {
                    id: 1,
                    username: 'admin',
                    email: 'admin@example.com',
                    status: 'active'
                },
                roles: [{ id: 1, name: 'admin' }],
                menus: [
                    { id: 1, name: '仪表板', path: '/dashboard', icon: 'tachometer-alt' },
                    { id: 2, name: '广告链接', path: '/links', icon: 'link' },
                    { id: 3, name: '域名管理', path: '/domains', icon: 'globe' }
                ]
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } else if (path === '/api/links' && request.method === 'GET') {
        response = new Response(JSON.stringify({
            success: true,
            data: []
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } else if (path === '/api/links' && request.method === 'POST') {
        response = new Response(JSON.stringify({
            success: true,
            message: '广告链接创建成功',
            data: { id: Date.now() }
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } else if (path.startsWith('/api/links/') && request.method === 'PATCH') {
        const linkId = path.split('/')[3];
        response = new Response(JSON.stringify({
            success: true,
            message: '链接已启动',
            data: { affectedRows: 1 }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } else if (path === '/api/dashboard/stats' && request.method === 'GET') {
        response = new Response(JSON.stringify({
            success: true,
            data: {
                totalLinks: 0,
                runningLinks: 0,
                stoppedLinks: 0,
                totalRuns: 0
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } else if (path === '/api/domains' && request.method === 'GET') {
        response = new Response(JSON.stringify({
            success: true,
            data: [
                { id: 1, domain: 'example1.com', usage_count: 5 },
                { id: 2, domain: 'example2.com', usage_count: 3 }
            ]
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } else if (path === '/api/domains' && request.method === 'POST') {
        response = new Response(JSON.stringify({
            success: true,
            message: '域名添加成功',
            data: { id: Date.now() }
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } else if (path === '/') {
        // 根路径处理 - 用于调试
        response = new Response(JSON.stringify({
            success: true,
            message: 'API 服务运行正常（模拟版本）',
            timestamp: new Date().toISOString(),
            availableEndpoints: [
                'POST /api/auth/login (测试账号: admin/admin123)',
                'GET /api/auth/profile',
                'GET /api/links',
                'POST /api/links',
                'PATCH /api/links/:id/status',
                'GET /api/dashboard/stats',
                'GET /api/domains'
            ]
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } else {
        // 404处理
        response = new Response(JSON.stringify({
            success: false,
            message: '接口不存在'
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    return addCorsHeaders(response);
}

// Workers导出
export default {
    fetch: handleRequest
};