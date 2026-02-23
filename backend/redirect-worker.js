// Cloudflare Workers 跳转中转服务
// 处理广告点击流量的重定向

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        
        // 只处理GET请求
        if (request.method !== 'GET') {
            return new Response('Method not allowed', { status: 405 });
        }

        // 获取URL参数
        const target = url.searchParams.get('target');
        const newDomain = url.searchParams.get('new_domain');
        const lpurl = url.searchParams.get('lpurl'); // 兼容旧参数名
        
        // 优先使用target参数，如果没有则使用lpurl
        const finalTarget = target || lpurl;
        
        if (!finalTarget) {
            return new Response('Missing target parameter', { 
                status: 400,
                headers: { 'Content-Type': 'text/plain' }
            });
        }

        try {
            // 构建目标URL
            let redirectUrl;
            
            if (newDomain) {
                // 使用新域名替换原域名
                try {
                    const originalUrl = new URL(finalTarget);
                    // 替换域名为新域名，保留路径和查询参数
                    redirectUrl = `${originalUrl.protocol}//${newDomain}${originalUrl.pathname}${originalUrl.search}`;
                } catch (e) {
                    // 如果finalTarget不是有效URL，直接拼接
                    redirectUrl = `https://${newDomain}/${finalTarget}`;
                }
            } else {
                // 直接使用目标URL
                redirectUrl = finalTarget.startsWith('http') ? finalTarget : `https://${finalTarget}`;
            }

            // 创建重定向响应
            const response = new Response('Redirecting...', {
                status: 302,
                headers: {
                    'Location': redirectUrl,
                    'Cache-Control': 'no-cache',
                    'Access-Control-Allow-Origin': '*',
                    'X-Redirect-Engine': 'Ads-Tools-Worker'
                }
            });

            // 记录访问日志（可选）
            console.log(`Redirect: ${request.url} -> ${redirectUrl}`);
            
            // 可以在这里添加访问统计逻辑
            // await logAccess(request, redirectUrl, env);

            return response;

        } catch (error) {
            console.error('Redirect error:', error);
            return new Response('Internal Server Error', { 
                status: 500,
                headers: { 'Content-Type': 'text/plain' }
            });
        }
    }
};

// 可选的访问日志记录函数
async function logAccess(request, redirectUrl, env) {
    try {
        // 这里可以记录到D1数据库或其他存储
        const logData = {
            timestamp: new Date().toISOString(),
            ip: request.headers.get('CF-Connecting-IP'),
            userAgent: request.headers.get('User-Agent'),
            referer: request.headers.get('Referer'),
            originalUrl: request.url,
            redirectUrl: redirectUrl,
            country: request.headers.get('CF-IPCountry')
        };
        
        // 示例：发送到分析服务或保存到数据库
        console.log('Access log:', JSON.stringify(logData));
        
    } catch (error) {
        console.error('Log access error:', error);
    }
}