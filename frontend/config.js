// API 配置 - 使用实际域名
const API_CONFIG = {
    // 使用你提供的实际 Workers 域名
    BASE_URL: 'https://ads-automation-api.2420133012.workers.dev',
    
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

// 调试：打印当前配置
console.log('API Config BASE_URL:', API_CONFIG.BASE_URL);

window.API_CONFIG = API_CONFIG;