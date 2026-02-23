// 数据库初始化脚本
const DatabaseManager = require('../backend/utils/db');

async function initDatabase(env) {
    console.log('开始初始化数据库...');
    
    try {
        const db = new DatabaseManager(env.DB);
        
        // 这里可以添加额外的初始化逻辑
        // 比如创建索引、验证表结构等
        
        console.log('数据库初始化完成');
        return { success: true, message: '数据库初始化成功' };
        
    } catch (error) {
        console.error('数据库初始化失败:', error);
        return { success: false, message: error.message };
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    // 这里需要配置数据库连接
    // initDatabase().then(console.log).catch(console.error);
    console.log('请通过Cloudflare Workers环境运行此脚本');
}

module.exports = { initDatabase };