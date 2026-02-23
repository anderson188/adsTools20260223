# 广告链接自动化管理系统

## 项目概述

基于 Google Ads API 的广告链接自动化管理系统，支持多租户SaaS架构，通过 Cloudflare Workers 实现零服务器成本的链接轮换和流量中转。

## 技术架构

- **前端**: Cloudflare Pages (HTML + CSS + JavaScript)
- **后端**: Cloudflare Workers (Node.js)
- **数据库**: Cloudflare D1 (SQLite)
- **外部API**: Google Ads API
- **部署**: Cloudflare 生态 (Workers, Pages, D1)

## 项目结构

```
adsTools20260223/
├── frontend/                 # 前端代码
│   ├── index.html           # 主页面
│   ├── styles.css           # 样式文件
│   └── app.js              # 前端逻辑
├── backend/                 # 后端代码
│   ├── index.js             # Workers 主入口
│   ├── redirect-worker.js   # 跳转中转服务
│   ├── package.json         # 依赖配置
│   ├── wrangler.toml        # Workers 配置
│   └── utils/               # 工具类
│       ├── db.js           # 数据库操作
│       ├── auth.js         # 认证管理
│       └── googleAds.js    # Google Ads API
├── schema.sql              # 数据库表结构
├── scripts/                # 脚本文件
│   └── init-db.js          # 数据库初始化
└── README.md              # 说明文档
```

## 快速开始

### 1. 环境准备

#### Google Ads API 配置
1. 创建 Google Cloud 项目
2. 启用 Google Ads API
3. 配置 OAuth 2.0 桌面应用凭据
4. 在 Google Ads MCC 账户中申请 Standard Access 级别的 developer_token
5. 获取 client_id, client_secret, refresh_token

#### Cloudflare 账户配置
1. 注册 Cloudflare 账户
2. 准备一个域名（或使用 *.workers.dev 子域名）
3. 安装 Wrangler CLI: `npm install -g wrangler`

### 2. 数据库初始化

```bash 11
# 创建 D1 数据库
wrangler d1 create ads_automation_db

# 执行数据库初始化脚本
wrangler d1 execute ads_automation_db --file=schema.sql
```

### 3. 配置环境变量

编辑 `backend/wrangler.toml`，配置以下环境变量：

```toml
[vars]
JWT_SECRET = "your-jwt-secret-key"
GOOGLE_ADS_DEVELOPER_TOKEN = "your-developer-token"
GOOGLE_ADS_CLIENT_ID = "your-client-id"
GOOGLE_ADS_CLIENT_SECRET = "your-client-secret"
GOOGLE_ADS_REFRESH_TOKEN = "your-refresh-token"
WORKER_DOMAIN = "your-worker-domain.workers.dev"
```

### 4. 部署后端 API

```bash
cd backend
npm install
wrangler deploy
```

### 5. 部署跳转中转服务

```bash
# 创建独立的 Workers 服务用于跳转
wrangler deploy redirect-worker.js --name ads-redirect-worker
```

### 6. 部署前端

1. 将 `frontend/` 目录内容上传到 Cloudflare Pages
2. 配置自定义域名（可选）
3. 确保前端能够访问后端 API

## 默认账户信息

- **用户名**: admin
- **密码**: sj4977358@admin
- **角色**: 超级管理员

⚠️ **重要**: 生产环境部署后请立即修改默认密码！

## API 接口文档

### 认证相关
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/profile` - 获取用户信息

### 广告链接管理
- `GET /api/links` - 获取链接列表
- `POST /api/links` - 创建链接
- `PATCH /api/links/:id/status` - 更新链接状态
- `GET /api/dashboard/stats` - 获取统计数据

### 域名池管理
- `GET /api/domains` - 获取域名列表
- `POST /api/domains` - 添加域名（管理员）

## 功能特性

✅ 用户认证与 RBAC 权限管理  
✅ 广告链接 CRUD 操作  
✅ 批量启停任务  
✅ 域名池管理与智能轮换  
✅ 定时任务自动更换链接  
✅ Google Ads API 集成  
✅ 流量中转与重定向  
✅ 实时统计与日志  
✅ 响应式前端界面  
✅ 多租户数据隔离  

## 安全注意事项

1. **密码安全**: 使用 bcrypt 强哈希算法存储
2. **API通信**: 全站 HTTPS 加密
3. **JWT认证**: 安全的会话管理
4. **数据隔离**: 严格的用户数据访问控制
5. **凭据保护**: Google Ads API 凭据存储在环境变量中

## 成本优化

- 充分利用 Cloudflare 免费套餐
- Workers: 每日10万次免费请求
- D1: 每日50万次读取，5万次写入免费
- Pages: 每月100GB 带宽免费

## 故障排除

### Google Ads API 调用失败
1. 检查 developer_token 是否已批准
2. 验证 OAuth 凭据是否正确
3. 确认 MCC 账户有访问权限
4. 检查 API 调用频率是否超限

### 数据库连接问题
1. 确认 D1 数据库已正确创建
2. 检查 wrangler.toml 中的 database_id 配置
3. 验证表结构是否完整

### 前端无法连接后端
1. 检查 API 域名配置
2. 确认 CORS 设置正确
3. 验证 JWT token 是否有效

## 开发计划

- [x] 项目架构设计
- [x] 数据库设计与实现
- [x] 后端 API 开发
- [x] 前端界面开发
- [x] Google Ads API 集成
- [x] 定时任务系统
- [x] 跳转中转服务
- [ ] 单元测试
- [ ] 集成测试
- [ ] 性能优化
- [ ] 监控告警

## 技术支持

如有问题请联系开发团队。

## 许可证

MIT License