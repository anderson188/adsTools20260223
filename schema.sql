-- 广告链接自动化管理系统数据库Schema
-- Cloudflare D1 SQLite数据库

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- 角色表
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 菜单表
CREATE TABLE IF NOT EXISTS menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    path VARCHAR(200),
    icon VARCHAR(50),
    parent_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES menus(id)
);

-- 角色菜单权限表
CREATE TABLE IF NOT EXISTS role_menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL,
    menu_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
    UNIQUE(role_id, menu_id)
);

-- 用户角色表
CREATE TABLE IF NOT EXISTS user_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE(user_id, role_id)
);

-- 广告链接表
CREATE TABLE IF NOT EXISTS ad_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    affiliate_name VARCHAR(100) NOT NULL,
    affiliate_link TEXT NOT NULL,
    mcc_account_id VARCHAR(50),
    google_ads_account_id VARCHAR(50) NOT NULL,
    campaign_name VARCHAR(200) NOT NULL,
    landing_domain VARCHAR(200) NOT NULL,
    run_frequency INTEGER DEFAULT 60,
    referer TEXT,
    status VARCHAR(20) DEFAULT 'stopped' CHECK (status IN ('running', 'stopped')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 域名池表
CREATE TABLE IF NOT EXISTS domain_pools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain VARCHAR(200) NOT NULL,
    referer TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    usage_count INTEGER DEFAULT 0,
    last_used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(domain)
);

-- 运行日志表
CREATE TABLE IF NOT EXISTS run_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad_link_id INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed')),
    message TEXT,
    old_tracking_template TEXT,
    new_tracking_template TEXT,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ad_link_id) REFERENCES ad_links(id) ON DELETE CASCADE
);

-- 插入默认系统菜单
INSERT INTO menus (name, path, icon, sort_order) VALUES 
('仪表板', '/dashboard', 'dashboard', 1),
('广告链接管理', '/links', 'link', 2),
('域名池管理', '/domains', 'globe', 3),
('统计报表', '/reports', 'chart', 4),
('系统管理', '/admin', 'settings', 5);

INSERT INTO menus (name, path, icon, parent_id, sort_order) VALUES 
('用户管理', '/admin/users', 'users', 5, 1),
('角色权限', '/admin/roles', 'shield', 5, 2);

-- 插入默认角色
INSERT INTO roles (name, description, is_system) VALUES 
('超级管理员', '拥有系统全部权限', TRUE),
('普通用户', '基础用户权限', FALSE);

-- 插入默认管理员用户 (密码: sj4977358@admin - 实际使用时应该hash)
INSERT INTO users (username, email, password_hash, status) VALUES 
('admin', 'admin@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ7HEy', 'active');

-- 分配管理员角色给用户
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1);

-- 分配所有菜单权限给超级管理员
INSERT INTO role_menus (role_id, menu_id) SELECT 1, id FROM menus;

-- 为普通用户分配基础菜单权限
INSERT INTO role_menus (role_id, menu_id) VALUES 
(2, 1), (2, 2), (2, 3), (2, 4);