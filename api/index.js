/**
 * Vercel Serverless 入口
 * 前端静态文件由 Vercel 托管，后端 API 走此函数
 * 环境变量（SUPABASE_URL / SUPABASE_ANON_KEY）在 Vercel 项目设置中配置
 */
const app = require('../app');

module.exports = app;
