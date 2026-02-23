// 纯JavaScript实现的密码工具 - 兼容Cloudflare Workers
// 替代bcryptjs，避免Node.js模块依赖

export class PasswordUtils {
    constructor() {
        this.saltRounds = 12;
    }

    // 简单的哈希函数（生产环境建议使用更强的算法）
    async hashPassword(password) {
        // 使用简单的SHA-256哈希 + salt
        const encoder = new TextEncoder();
        const data = encoder.encode(password + this.generateSalt());
        
        // 使用Web Crypto API进行哈希
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return hashHex;
    }

    // 验证密码
    async verifyPassword(password, hash) {
        const hashedInput = await this.hashPassword(password);
        return hashedInput === hash;
    }

    // 生成salt
    generateSalt() {
        const saltArray = new Uint8Array(16);
        crypto.getRandomValues(saltArray);
        return Array.from(saltArray, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // 生成简单密码哈希（用于测试）- 仅开发环境使用
    async simpleHash(password) {
        // 简单的base64编码，仅用于测试
        return btoa(password + '_salt_2026');
    }

    // 验证简单密码（用于测试）
    async simpleVerify(password, hash) {
        return btoa(password + '_salt_2026') === hash;
    }
}