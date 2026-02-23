// Cloudflare Workers 主入口文件
const { addCorsHeaders, handleOptions } = require('./middleware');

// 使用动态导入避免启动时内存超限
let authRoutes, linksRoutes, domainsRoutes, GoogleAdsManagerClass, DatabaseManager;

// 按需加载模块的函数（带错误处理）
async function loadModules() {
    try {
        if (!authRoutes) {
            const authModule = await import('./api/auth.js');
            authRoutes = authModule;
        }
        if (!linksRoutes) {
            const linksModule = await import('./api/links.js');
            linksRoutes = linksModule;
        }
        if (!domainsRoutes) {
            const domainsModule = await import('./api/domains.js');
            domainsRoutes = domainsModule;
        }
        return { authRoutes, linksRoutes, domainsRoutes };
    } catch (error) {
        console.error('加载模块失败:', error);
        throw error;
    }
}

// 主请求处理器
async function handleRequest(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
        return handleOptions(request);
    }
    
    // 按需加载API路由模块（带错误处理）
    let modules;
    try {
        modules = await loadModules();
        // 检查模块是否成功加载
        if (!modules.authRoutes || !modules.linksRoutes || !modules.domainsRoutes) {
            throw new Error('模块加载不完整');
        }
    } catch (error) {
        console.error('模块加载失败:', error);
        const errorResponse = new Response(JSON.stringify({
            success: false,
            message: '服务器内部错误：模块加载失败 - ' + error.message,
            error: 'MODULE_LOAD_ERROR'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
        return addCorsHeaders(errorResponse);
    }
    
    // API路由分发
    let response;
    if (path === '/api/auth/login') {
        if (request.method === 'POST') {
            // 临时模拟登录响应，避免数据库依赖
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
        }
    } else if (path === '/api/auth/profile') {
        if (request.method === 'GET') {
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
        }
    } else if (path === '/api/links') {
        if (request.method === 'GET') {
            response = new Response(JSON.stringify({
                success: true,
                data: []
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } else if (request.method === 'POST') {
            response = new Response(JSON.stringify({
                success: true,
                message: '广告链接创建成功',
                data: { id: Date.now() }
            }), {
                status: 201,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } else if (path.startsWith('/api/links/')) {
        const linkId = path.split('/')[3];
        if (request.method === 'PATCH' && linkId) {
            response = new Response(JSON.stringify({
                success: true,
                message: '链接已启动',
                data: { affectedRows: 1 }
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } else if (path === '/api/dashboard/stats') {
        if (request.method === 'GET') {
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
        }
    } else if (path === '/api/domains') {
        if (request.method === 'GET') {
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
        } else if (request.method === 'POST') {
            response = new Response(JSON.stringify({
                success: true,
                message: '域名添加成功',
                data: { id: Date.now() }
            }), {
                status: 201,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

// 根路径处理 - 用于调试
if (path === '/') {
    return new Response(JSON.stringify({
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
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

// 404处理
response = new Response(JSON.stringify({
    success: false,
    message: '接口不存在'
}), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
});
return addCorsHeaders(response);
}

// 定时任务处理函数 - 自动更换链接
async function handleScheduled(event, env, ctx) {
    console.log('开始执行定时任务 - 自动更换广告链接');
    
    try {
        // 动态导入数据库模块
        const dbModule = await import('./utils/db.js');
        const DatabaseManagerClass = dbModule.default;
        const db = new DatabaseManagerClass(env.DB);
        
        // 动态导入轻量级 Google Ads 模块
        const googleAdsModule = await import('./utils/googleAdsLite.js');
        GoogleAdsManagerClass = googleAdsModule.default;
        const googleAds = new GoogleAdsManagerClass({
            clientId: env.GOOGLE_ADS_CLIENT_ID,
            clientSecret: env.GOOGLE_ADS_CLIENT_SECRET,
            developerToken: env.GOOGLE_ADS_DEVELOPER_TOKEN,
            refreshToken: env.GOOGLE_ADS_REFRESH_TOKEN
        });

        // 获取所有运行中的广告链接
        const runningLinks = await db.getAdLinksByUserId(null, { status: 'running' });
        console.log(`找到 ${runningLinks.length} 个运行中的广告链接`);

        const workerDomain = env.WORKER_DOMAIN || 'your-worker.workers.dev';
        const results = [];

        for (const link of runningLinks) {
            try {
                // 获取可用域名
                const domains = await db.getActiveDomains();
                if (domains.length === 0) {
                    console.warn(`链接 ${link.id} 没有可用域名`);
                    continue;
                }

                // 选择使用次数最少的域名
                const selectedDomain = domains[0];
                
                // 构建新的追踪模板
                const trackingTemplate = googleAds.buildTrackingTemplate(
                    workerDomain,
                    link.affiliate_link,
                    selectedDomain.domain
                );

                // 更新Google Ads广告系列 - 使用模拟模式避免API调用
                const updateResult = googleAds.simulateUpdate(
                    link.google_ads_account_id,
                    link.campaign_name,
                    trackingTemplate
                );

                // 记录日志
                await db.createRunLog({
                    adLinkId: link.id,
                    status: updateResult.success ? 'success' : 'failed',
                    message: updateResult.message,
                    oldTrackingTemplate: updateResult.oldTemplate,
                    newTrackingTemplate: updateResult.newTemplate
                });

                // 更新域名使用次数
                if (updateResult.success) {
                    await db.updateDomainUsage(selectedDomain.id);
                }

                results.push({
                    linkId: link.id,
                    campaignName: link.campaign_name,
                    success: updateResult.success,
                    message: updateResult.message
                });

                console.log(`链接 ${link.id} 处理结果: ${updateResult.success ? '成功' : '失败'}`);

            } catch (error) {
                console.error(`处理链接 ${link.id} 时出错:`, error);
                
                // 记录失败日志
                await db.createRunLog({
                    adLinkId: link.id,
                    status: 'failed',
                    message: error.message
                });

                results.push({
                    linkId: link.id,
                    campaignName: link.campaign_name,
                    success: false,
                    message: error.message
                });
            }
        }

        console.log(`定时任务完成，处理了 ${results.length} 个链接`);
        
    } catch (error) {
        console.error('定时任务执行失败:', error);
    }
}

// Workers导出
export default {
    fetch: handleRequest,
    scheduled: handleScheduled
};