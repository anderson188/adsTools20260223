// 广告链接自动化管理系统 - 前端应用
class AdsManagerApp {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.currentUser = null;
        this.menus = [];
        this.init();
    }

    init() {
        this.bindEvents();
        
        if (this.token) {
            this.validateToken();
        } else {
            this.showLoginPage();
        }
    }

    bindEvents() {
        // 登录表单
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // 退出登录
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // 侧边栏切换
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // 模态框关闭
        document.getElementById('modalClose').addEventListener('click', () => {
            this.closeModal();
        });

        // 点击模态框外部关闭
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') {
                this.closeModal();
            }
        });

        // 菜单导航
        document.getElementById('sidebarMenu').addEventListener('click', (e) => {
            e.preventDefault();
            const link = e.target.closest('a');
            if (link) {
                const page = link.dataset.page;
                this.navigateToPage(page);
            }
        });

        // 筛选器
        document.getElementById('applyFilters').addEventListener('click', () => {
            this.loadLinks();
        });

        // 新增链接
        document.getElementById('addLinkBtn').addEventListener('click', () => {
            this.showAddLinkModal();
        });
    }

    // 显示登录页面
    showLoginPage() {
        document.getElementById('loginPage').classList.add('active');
        document.getElementById('mainApp').classList.remove('active');
    }

    // 显示主应用
    showMainApp() {
        document.getElementById('loginPage').classList.remove('active');
        document.getElementById('mainApp').classList.add('active');
    }

    // 处理登录
    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const messageEl = document.getElementById('loginMessage');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (result.success) {
                this.token = result.data.token;
                this.currentUser = result.data.user;
                this.menus = result.data.menus;
                
                localStorage.setItem('authToken', this.token);
                localStorage.setItem('userInfo', JSON.stringify(this.currentUser));
                
                this.showMainApp();
                this.initializeApp();
                
                this.showMessage('登录成功', 'success');
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('登录失败，请稍后重试', 'error');
        }
    }

    // 验证Token
    async validateToken() {
        try {
            const response = await fetch('/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.currentUser = result.data.user;
                this.menus = result.data.menus;
                this.showMainApp();
                this.initializeApp();
            } else {
                this.handleLogout();
            }
        } catch (error) {
            console.error('Token validation error:', error);
            this.handleLogout();
        }
    }

    // 处理退出登录
    handleLogout() {
        this.token = null;
        this.currentUser = null;
        this.menus = [];
        
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        
        this.showLoginPage();
        
        // 清空表单
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }

    // 初始化应用
    initializeApp() {
        // 设置用户信息
        document.getElementById('userName').textContent = this.currentUser.username;
        
        // 生成菜单
        this.generateMenu();
        
        // 加载仪表板数据
        this.loadDashboardStats();
        
        // 默认显示仪表板
        this.navigateToPage('dashboard');
    }

    // 生成菜单
    generateMenu() {
        const menuContainer = document.getElementById('sidebarMenu');
        menuContainer.innerHTML = '';

        this.menus.forEach(menu => {
            if (!menu.parent_id) {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#';
                a.dataset.page = this.getPageFromPath(menu.path);
                a.innerHTML = `
                    <i class="fas fa-${menu.icon}"></i>
                    <span>${menu.name}</span>
                `;
                
                // 添加子菜单
                const children = this.menus.filter(m => m.parent_id === menu.id);
                if (children.length > 0) {
                    const ul = document.createElement('ul');
                    ul.style.display = 'none';
                    
                    children.forEach(child => {
                        const childLi = document.createElement('li');
                        const childA = document.createElement('a');
                        childA.href = '#';
                        childA.dataset.page = this.getPageFromPath(child.path);
                        childA.innerHTML = `
                            <i class="fas fa-${child.icon}"></i>
                            <span>${child.name}</span>
                        `;
                        childLi.appendChild(childA);
                        ul.appendChild(childLi);
                    });
                    
                    li.appendChild(a);
                    li.appendChild(ul);
                    
                    // 子菜单点击事件
                    a.addEventListener('click', (e) => {
                        e.preventDefault();
                        const isVisible = ul.style.display === 'block';
                        ul.style.display = isVisible ? 'none' : 'block';
                    });
                } else {
                    li.appendChild(a);
                }
                
                menuContainer.appendChild(li);
            }
        });
    }

    // 从路径获取页面名称
    getPageFromPath(path) {
        const pageMap = {
            '/dashboard': 'dashboard',
            '/links': 'links',
            '/domains': 'domains',
            '/reports': 'reports',
            '/admin': 'admin'
        };
        return pageMap[path] || 'dashboard';
    }

    // 页面导航
    navigateToPage(page) {
        // 隐藏所有页面
        document.querySelectorAll('.content-page').forEach(p => {
            p.classList.remove('active');
        });
        
        // 移除所有菜单激活状态
        document.querySelectorAll('.sidebar-menu a').forEach(a => {
            a.classList.remove('active');
        });
        
        // 显示目标页面
        const targetPage = document.getElementById(page + 'Page');
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // 激活菜单
        const activeMenu = document.querySelector(`[data-page="${page}"]`);
        if (activeMenu) {
            activeMenu.classList.add('active');
        }
        
        // 更新页面标题
        const titles = {
            dashboard: '仪表板',
            links: '广告链接管理',
            domains: '域名池管理',
            reports: '统计报表',
            admin: '系统管理'
        };
        document.getElementById('pageTitle').textContent = titles[page] || '仪表板';
        
        // 加载页面特定数据
        switch(page) {
            case 'dashboard':
                this.loadDashboardStats();
                break;
            case 'links':
                this.loadLinks();
                break;
        }
    }

    // 加载仪表板统计数据
    async loadDashboardStats() {
        try {
            const response = await fetch('/api/dashboard/stats', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                const stats = result.data;
                
                document.getElementById('totalLinks').textContent = stats.totalLinks || 0;
                document.getElementById('runningLinks').textContent = stats.runningLinks || 0;
                document.getElementById('stoppedLinks').textContent = stats.stoppedLinks || 0;
                document.getElementById('totalRuns').textContent = stats.totalRuns || 0;
            }
        } catch (error) {
            console.error('Load dashboard stats error:', error);
        }
    }

    // 加载链接列表
    async loadLinks() {
        try {
            const status = document.getElementById('statusFilter').value;
            const affiliate = document.getElementById('affiliateFilter').value;
            const campaign = document.getElementById('campaignFilter').value;
            
            const params = new URLSearchParams();
            if (status) params.append('status', status);
            if (affiliate) params.append('affiliate_name', affiliate);
            if (campaign) params.append('campaign_name', campaign);
            
            const response = await fetch(`/api/links?${params}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.renderLinksTable(result.data);
            }
        } catch (error) {
            console.error('Load links error:', error);
        }
    }

    // 渲染链接表格
    renderLinksTable(links) {
        const tbody = document.querySelector('#linksTable tbody');
        tbody.innerHTML = '';

        links.forEach(link => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${link.affiliate_name}</td>
                <td>${link.campaign_name}</td>
                <td>${link.google_ads_account_id}</td>
                <td>每 ${link.run_frequency} 分钟</td>
                <td>
                    <span class="status-badge status-${link.status}">
                        ${link.status === 'running' ? '运行中' : '已停止'}
                    </span>
                </td>
                <td>${new Date(link.created_at).toLocaleString()}</td>
                <td>
                    <button class="btn btn-sm btn-${link.status === 'running' ? 'warning' : 'success'}" 
                            onclick="app.toggleLinkStatus(${link.id}, '${link.status}')">
                        <i class="fas fa-${link.status === 'running' ? 'pause' : 'play'}"></i>
                        ${link.status === 'running' ? '停止' : '启动'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="app.deleteLink(${link.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // 切换链接状态
    async toggleLinkStatus(linkId, currentStatus) {
        const newStatus = currentStatus === 'running' ? 'stopped' : 'running';
        
        try {
            const response = await fetch(`/api/links/${linkId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                this.loadLinks();
                this.loadDashboardStats();
                this.showMessage(`链接已${newStatus === 'running' ? '启动' : '停止'}`, 'success');
            } else {
                this.showMessage('操作失败', 'error');
            }
        } catch (error) {
            console.error('Toggle link status error:', error);
            this.showMessage('操作失败', 'error');
        }
    }

    // 显示新增链接模态框
    showAddLinkModal() {
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <form id="addLinkForm">
                <div class="form-group">
                    <label for="affiliateName">联盟名称 *</label>
                    <input type="text" id="affiliateName" name="affiliate_name" required>
                </div>
                <div class="form-group">
                    <label for="affiliateLink">联盟链接 *</label>
                    <input type="url" id="affiliateLink" name="affiliate_link" required>
                </div>
                <div class="form-group">
                    <label for="mccAccountId">MCC账户ID</label>
                    <input type="text" id="mccAccountId" name="mcc_account_id">
                </div>
                <div class="form-group">
                    <label for="googleAdsAccountId">Google Ads账户ID *</label>
                    <input type="text" id="googleAdsAccountId" name="google_ads_account_id" required>
                </div>
                <div class="form-group">
                    <label for="campaignName">广告系列名称 *</label>
                    <input type="text" id="campaignName" name="campaign_name" required>
                </div>
                <div class="form-group">
                    <label for="landingDomain">落地页域名 *</label>
                    <input type="text" id="landingDomain" name="landing_domain" required>
                </div>
                <div class="form-group">
                    <label for="runFrequency">运行频率（分钟）</label>
                    <input type="number" id="runFrequency" name="run_frequency" value="60" min="1">
                </div>
                <div class="form-group">
                    <label for="referer">引荐来源</label>
                    <input type="text" id="referer" name="referer" placeholder="多个用逗号分隔">
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">创建链接</button>
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">取消</button>
                </div>
            </form>
        `;
        
        document.getElementById('modalTitle').textContent = '新增广告链接';
        this.openModal();
        
        // 绑定表单提交事件
        document.getElementById('addLinkForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddLink();
        });
    }

    // 处理新增链接
    async handleAddLink() {
        const formData = new FormData(document.getElementById('addLinkForm'));
        const linkData = Object.fromEntries(formData);
        
        try {
            const response = await fetch('/api/links', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(linkData)
            });

            if (response.ok) {
                this.closeModal();
                this.loadLinks();
                this.loadDashboardStats();
                this.showMessage('广告链接创建成功', 'success');
            } else {
                const result = await response.json();
                this.showMessage(result.message || '创建失败', 'error');
            }
        } catch (error) {
            console.error('Add link error:', error);
            this.showMessage('创建失败', 'error');
        }
    }

    // 打开模态框
    openModal() {
        document.getElementById('modal').classList.add('active');
    }

    // 关闭模态框
    closeModal() {
        document.getElementById('modal').classList.remove('active');
    }

    // 切换侧边栏（移动端）
    toggleSidebar() {
        document.querySelector('.sidebar').classList.toggle('mobile-open');
    }

    // 显示消息提示
    showMessage(message, type = 'info') {
        const messageEl = document.getElementById('loginMessage');
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.className = `message ${type}`;
            messageEl.style.display = 'block';
            
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 3000);
        }
    }
}

// 初始化应用
const app = new AdsManagerApp();