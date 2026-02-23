// 认证和用户管理工具类
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthManager {
    constructor(jwtSecret) {
        this.jwtSecret = jwtSecret;
        this.saltRounds = 12;
    }

    // 密码加密
    async hashPassword(password) {
        return await bcrypt.hash(password, this.saltRounds);
    }

    // 密码验证
    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    // 生成JWT Token
    generateToken(payload) {
        return jwt.sign(payload, this.jwtSecret, { expiresIn: '24h' });
    }

    // 验证JWT Token
    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    // 检查用户权限
    hasPermission(userRoles, requiredPermission) {
        // 这里简化处理，实际应该检查具体的权限标识
        const adminRoles = ['超级管理员'];
        return userRoles.some(role => adminRoles.includes(role.name));
    }

    // 验证管理员权限
    isAdmin(userRoles) {
        return this.hasPermission(userRoles, 'admin');
    }
}

module.exports = AuthManager;