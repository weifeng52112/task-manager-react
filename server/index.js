/**
 * 智能任务管理系统 - 后端
 * 标准技术栈：Node.js + Express + Supabase（@supabase/supabase-js）
 * 不依赖任何第三方/豆包专属工具
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;
const PRIORITIES = ['高', '中', '低'];

// 配置校验
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ 缺少 Supabase 配置！请复制 .env.example 为 .env 并填写 SUPABASE_URL 和 SUPABASE_ANON_KEY');
  process.exit(1);
}

// Supabase 客户端（匿名公钥，仅做 RLS 允许的读写）
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.use(cors());
app.use(express.json());

// ---------- 获取任务列表（支持优先级筛选，按创建时间倒序） ----------
app.get('/api/tasks', async (req, res) => {
  try {
    const { filter } = req.query;
    let query = supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter && filter !== '全部' && PRIORITIES.includes(filter)) {
      query = query.eq('priority', filter);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- 添加任务 ----------
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, priority } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: '任务标题不能为空' });
    }
    const p = PRIORITIES.includes(priority) ? priority : '中';

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ title: String(title).trim(), priority: p, completed: false }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- 切换完成状态 ----------
app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;
    if (typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'completed 必须是布尔值' });
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({ completed })
      .eq('id', id)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: '任务不存在' });
    }
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- 删除任务 ----------
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- 生产环境：托管前端构建产物 ----------
if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '..', 'dist');
  app.use(express.static(dist));
  // SPA 路由兜底
  app.get('*', (req, res) => {
    res.sendFile(path.join(dist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`✅ 后端服务已启动：http://localhost:${PORT}`);
});
