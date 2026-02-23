// Cloudflare Workers 主入口文件

// 使用动态导入避免启动时内存超限
let authRoutes, linksRoutes, domainsRoutes, GoogleAdsManagerClass, DatabaseManager;

// 按需加载模块的函数
async function loadModules() {
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
}

// 主请求处理器
async function handleRequest(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 按需加载API路由模块
    const modules = await loadModules();
    
    // API路由分发
    if (path === '/api/auth/login') {
        if (request.method === 'POST') {
            return await modules.authRoutes.login(request, env);
        }
    } else if (path === '/api/auth/profile') {
        if (request.method === 'GET') {
            return await modules.authRoutes.getProfile(request, env);
        }
    } else if (path === '/api/links') {
        if (request.method === 'GET') {
            return await modules.linksRoutes.getLinks(request, env);
        } else if (request.method === 'POST') {
            return await modules.linksRoutes.createLink(request, env);
        }
    } else if (path.startsWith('/api/links/')) {
        const linkId = path.split('/')[3];
        if (request.method === 'PATCH' && linkId) {
            return await modules.linksRoutes.updateLinkStatus(request, env, linkId);
        }
    } else if (path === '/api/dashboard/stats') {
        if (request.method === 'GET') {
            return await modules.linksRoutes.getDashboardStats(request, env);
        }
    } else if (path === '/api/domains') {
        if (request.method === 'GET') {
            return await modules.domainsRoutes.getDomains(request, env);
        } else if (request.method === 'POST') {
            return await modules.domainsRoutes.addDomain(request, env);
        }
    }

    // 404处理
    return new Response(JSON.stringify({
        success: false,
        message: '接口不存在'
    }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
    });
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