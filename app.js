/**
 * Express 应用核心（共享给本地 server 与 Vercel serverless 使用）
 * 所有 API 路由定义在此，不包含 dotenv / listen / 静态托管
 */
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PRIORITIES = ['高', '中', '低'];

// Supabase 客户端（环境变量注入；本地由 .env 提供，Vercel 由项目环境变量提供）
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

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

module.exports = app;
