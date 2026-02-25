// 测试密码验证功能
import PasswordUtils from './utils/password-utils.js';

async function testPassword() {
    console.log('Testing password verification...');
    
    const pwd = new PasswordUtils();
    
    // 测试已知密码
    const result = await pwd.verifyPassword('sj4977358@admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ7HEy');
    console.log('Password verification result:', result);
    
    // 测试错误密码
    const wrongResult = await pwd.verifyPassword('wrongpassword', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ7HEy');
    console.log('Wrong password result:', wrongResult);
}

testPassword().catch(console.error);