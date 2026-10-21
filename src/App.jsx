import { useEffect, useState } from 'react';

const PRIORITIES = ['高', '中', '低'];
const FILTERS = ['全部', '高', '中', '低'];

const priorityClass = p => (p === '高' ? 'high' : p === '中' ? 'medium' : 'low');

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('中');
  const [filter, setFilter] = useState('全部');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // 提示条
  const notify = text => {
    setMessage(text);
    setTimeout(() => setMessage(null), 1800);
  };

  // 加载任务列表
  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?filter=${encodeURIComponent(filter)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '加载失败');
      setTasks(data);
    } catch (err) {
      notify('⚠️ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTasks(); }, [filter]); // eslint-disable-line

  // 添加任务
  const addTask = async () => {
    const text = title.trim();
    if (!text) { notify('请输入任务内容'); return; }
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: text, priority }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '添加失败');
      setTitle('');
      notify('✅ 已添加');
      loadTasks();
    } catch (err) {
      notify('❌ ' + err.message);
    }
  };

  // 切换完成状态
  const toggleTask = async (id, completed) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '切换失败');
      loadTasks();
    } catch (err) {
      notify('❌ ' + err.message);
    }
  };

  // 删除任务
  const deleteTask = async (id) => {
    if (!window.confirm('确定删除这条任务吗？')) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      notify('🗑️ 已删除');
      loadTasks();
    } catch (err) {
      notify('❌ ' + err.message);
    }
  };

  return (
    <div className="container">
      <h1>📋 智能任务管理系统</h1>

      {/* 添加区域 */}
      <div className="add-area">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addTask(); }}
          placeholder="输入任务内容..."
          maxLength={200}
        />
        <select value={priority} onChange={e => setPriority(e.target.value)}>
          <option value="高">🔴 高</option>
          <option value="中">🟡 中</option>
          <option value="低">🟢 低</option>
        </select>
        <button className="btn add-btn" onClick={addTask}>添加任务</button>
      </div>

      {/* 筛选栏 */}
      <div className="filter-bar">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === '全部' ? f : f + '优先级'}
          </button>
        ))}
        <span className="count-tip">共 {tasks.length} 条</span>
      </div>

      {/* 任务列表 */}
      <div className="task-list">
        {loading ? (
          <div className="empty">加载中...</div>
        ) : tasks.length === 0 ? (
          <div className="empty">暂无任务，添加一个吧 ✨</div>
        ) : (
          tasks.map(task => (
            <div className="task-item" key={task.id}>
              <input
                type="checkbox"
                className="task-check"
                checked={task.completed}
                onChange={() => toggleTask(task.id, task.completed)}
              />
              <div className={`task-title ${task.completed ? 'completed' : ''}`}>
                {task.title}
              </div>
              <span className={`priority-tag ${priorityClass(task.priority)}`}>
                {task.priority}
              </span>
              <button
                className={`btn toggle-btn ${task.completed ? 'done' : ''}`}
                onClick={() => toggleTask(task.id, task.completed)}
              >
                {task.completed ? '未完成' : '完成'}
              </button>
              <button
                className="btn del-btn"
                onClick={() => deleteTask(task.id)}
              >
                删除
              </button>
            </div>
          ))
        )}
      </div>

      {message && <div className="toast">{message}</div>}
    </div>
  );
}
