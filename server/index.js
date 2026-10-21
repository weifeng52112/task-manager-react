/**
 * 智能任务管理系统 - 本地/生产服务入口
 * 加载共享 app.js，NODE_ENV=production 时托管前端构建产物(dist)，单端口运行
 */
require('dotenv').config();
const path = require('path');
const app = require('../app');

const PORT = process.env.PORT || 3001;

// 配置校验（仅本地/生产自检；Vercel 由项目环境变量提供，不在此校验）
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ 缺少 Supabase 配置！请复制 .env.example 为 .env 并填写 SUPABASE_URL 和 SUPABASE_ANON_KEY');
  process.exit(1);
}

// 生产环境：托管前端构建产物
if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '..', 'dist');
  app.use(require('express').static(dist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(dist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`✅ 后端服务已启动：http://localhost:${PORT}`);
});
