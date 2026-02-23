// 认证和用户管理工具类 - 适配Cloudflare Workers
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default class AuthManager {
    constructor(jwtSecret) {
        this.jwtSecret = jwtSecret;
        this.saltRounds = 12;
    }

    // 密码加密
    async hashPassword(password) {
        return await bcrypt.hash(password, this.saltRounds);
    }

    // 验证密码
    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    // 生成JWT Token
    generateToken(payload) {
        return jwt.sign(payload, this.jwtSecret, { expiresIn: '24h' });
    }

    // 验证Token
    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    // 检查是否为管理员
    isAdmin(roles) {
        return roles.some(role => role.name === 'admin');
    }
}