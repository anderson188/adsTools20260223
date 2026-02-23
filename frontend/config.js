// API 配置
const API_CONFIG = {
    // 根据实际部署的 Workers 域名进行修改
    BASE_URL: 'https://ads-automation-api.YOUR_SUBDOMAIN.workers.dev',
    
    // API 端点
    ENDPOINTS: {
        LOGIN: '/api/auth/login',
        PROFILE: '/api/auth/profile',
        LINKS: '/api/links',
        DASHBOARD_STATS: '/api/dashboard/stats',
        DOMAINS: '/api/domains'
    },
    
    // 获取完整的 API URL
    getUrl(endpoint) {
        return `${this.BASE_URL}${endpoint}`;
    }
};

// 开发环境下的配置（本地测试用）
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    API_CONFIG.BASE_URL = 'http://localhost:8787'; // wrangler dev 的默认端口
}

// 根据部署情况手动设置（临时方案）
// API_CONFIG.BASE_URL = 'https://ads-automation-api.workers.dev'; // 替换为你的实际域名

window.API_CONFIG = API_CONFIG;