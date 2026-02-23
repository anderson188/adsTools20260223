// 认证和用户管理工具类 - 适配Cloudflare Workers
import PasswordUtils from './password-utils.js';
import SimpleJWT from './jwt-alternative.js';

export default class AuthManager {
    constructor(jwtSecret) {
        this.jwtSecret = jwtSecret;
        this.passwordUtils = new PasswordUtils();
        this.jwt = new SimpleJWT(jwtSecret);
    }

    // 密码加密
    async hashPassword(password) {
        return await this.passwordUtils.hashPassword(password);
    }

    // 验证密码
    async verifyPassword(password, hash) {
        return await this.passwordUtils.verifyPassword(password, hash);
    }

    // 生成JWT Token
    async generateToken(payload) {
        return await this.jwt.generateToken(payload, '24h');
    }

    // 验证Token
    async verifyToken(token) {
        return await this.jwt.verifyToken(token);
    }

    // 检查是否为管理员
    isAdmin(roles) {
        return roles.some(role => role.name === 'admin');
    }
}