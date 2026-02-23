// 认证相关API路由
import AuthManager from '../utils/auth.js';
import DatabaseManager from '../utils/db.js';

exports.login = async (request, env) => {
    try {
        const { username, password } = await request.json();
        
        if (!username || !password) {
            return new Response(JSON.stringify({
                success: false,
                message: '用户名和密码不能为空'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const db = new DatabaseManager(env.DB);
        const auth = new AuthManager(env.JWT_SECRET);

        // 查找用户
        const user = await db.getUserByUsername(username);
        if (!user) {
            return new Response(JSON.stringify({
                success: false,
                message: '用户名或密码错误'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 验证密码
        const isValidPassword = await auth.verifyPassword(password, user.password_hash);
        if (!isValidPassword) {
            return new Response(JSON.stringify({
                success: false,
                message: '用户名或密码错误'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 获取用户角色和权限
        const roles = await db.getUserRoles(user.id);
        const menus = await db.getUserMenus(user.id);

        // 生成JWT Token
        const token = auth.generateToken({
            userId: user.id,
            username: user.username,
            roles: roles.map(r => ({ id: r.id, name: r.name }))
        });

        // 更新最后登录时间
        // 这里需要添加更新last_login的逻辑

        return new Response(JSON.stringify({
            success: true,
            message: '登录成功',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                },
                roles,
                menus
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Login error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '服务器内部错误'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

exports.getProfile = async (request, env) => {
    try {
        // 从Authorization header获取token
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({
                success: false,
                message: '未提供有效的认证令牌'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.substring(7);
        const auth = new AuthManager(env.JWT_SECRET);
        const decoded = auth.verifyToken(token);

        const db = new DatabaseManager(env.DB);
        const user = await db.getUserByUsername(decoded.username);
        const roles = await db.getUserRoles(user.id);
        const menus = await db.getUserMenus(user.id);

        return new Response(JSON.stringify({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    status: user.status
                },
                roles,
                menus
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            message: '无效的认证令牌'
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};