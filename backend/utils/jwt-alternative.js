// JWT替代方案 - 纯JavaScript实现
// 当jsonwebtoken不可用时使用
// 注意：这些函数在Workers环境中运行，使用Web Crypto API

export class SimpleJWT {
    constructor(secret) {
        this.secret = secret;
    }

    // Base64 URL编码
    base64UrlEncode(str) {
        if (typeof btoa !== 'undefined') {
            // 浏览器/Workers环境
            return btoa(str)
                .replace(/=/g, '')
                .replace(/\+/g, '-')
                .replace(/\//g, '_');
        } else {
            // Node.js环境
            return Buffer.from(str).toString('base64')
                .replace(/=/g, '')
                .replace(/\+/g, '-')
                .replace(/\//g, '_');
        }
    }

    // Base64 URL解码
    base64UrlDecode(str) {
        str = str.replace(/-/g, '+').replace(/_/g, '/')
        if (typeof atob !== 'undefined') {
            return atob(str);
        } else {
            return Buffer.from(str, 'base64').toString();
        }
    }

    // SHA-256哈希
    async sha256(text) {
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            // Workers环境
            const encoder = new TextEncoder();
            const data = encoder.encode(text);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } else {
            // Node.js环境模拟
            const crypto = require('crypto');
            return crypto.createHash('sha256').update(text).digest('hex');
        }
    }

    // 生成JWT Token
    async generateToken(payload, expiresIn = '24h') {
        const header = {
            alg: 'HS256',
            typ: 'JWT'
        };

        // 计算过期时间
        let exp = Math.floor(Date.now() / 1000);
        if (expiresIn.endsWith('h')) {
            exp += parseInt(expiresIn) * 3600;
        } else if (expiresIn.endsWith('m')) {
            exp += parseInt(expiresIn) * 60;
        } else {
            exp += 86400; // 默认24小时
        }

        const payloadWithExp = {
            ...payload,
            exp: exp,
            iat: Math.floor(Date.now() / 1000)
        };

        const headerEncoded = this.base64UrlEncode(JSON.stringify(header));
        const payloadEncoded = this.base64UrlEncode(JSON.stringify(payloadWithExp));
        
        const signatureInput = `${headerEncoded}.${payloadEncoded}`;
        const signature = await this.sha256(signatureInput + this.secret);
        const signatureEncoded = this.base64UrlEncode(signature);

        return `${headerEncoded}.${payloadEncoded}.${signatureEncoded}`;
    }

    // 验证JWT Token
    async verifyToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid token format');
            }

            const [headerEncoded, payloadEncoded, signatureEncoded] = parts;
            const signatureInput = `${headerEncoded}.${payloadEncoded}`;
            const expectedSignature = await this.sha256(signatureInput + this.secret);
            const expectedSignatureEncoded = this.base64UrlEncode(expectedSignature);

            if (signatureEncoded !== expectedSignatureEncoded) {
                throw new Error('Invalid signature');
            }

            const payload = JSON.parse(this.base64UrlDecode(payloadEncoded));
            
            // 检查过期时间
            if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
                throw new Error('Token expired');
            }

            return payload;
        } catch (error) {
            throw new Error('Invalid token: ' + error.message);
        }
    }
}

// 默认导出
export default SimpleJWT;