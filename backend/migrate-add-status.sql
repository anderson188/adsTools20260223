-- 数据库迁移脚本：为menus表添加status列
-- 执行此脚本以修复 'no such column: m.status' 错误

-- 为menus表添加status列
ALTER TABLE menus ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- 更新现有菜单数据为active状态
UPDATE menus SET status = 'active' WHERE status IS NULL;

-- 验证更改
SELECT name, status FROM menus LIMIT 10;