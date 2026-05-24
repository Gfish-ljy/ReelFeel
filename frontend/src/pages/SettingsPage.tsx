import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Tag {
  id: string;
  name: string;
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuthStore();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const loadMeta = () => {
    api.get<Category[]>('/categories').then((r) => setCategories(r.data));
    api.get<Tag[]>('/tags').then((r) => setTags(r.data));
  };

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    if (user) setNickname(user.nickname);
  }, [user]);

  const saveProfile = async () => {
    await updateProfile({ nickname });
    alert('资料已更新');
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    await api.post('/categories', { name: newCategory });
    setNewCategory('');
    loadMeta();
  };

  const addTag = async () => {
    if (!newTag.trim()) return;
    await api.post('/tags', { name: newTag });
    setNewTag('');
    loadMeta();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('删除此分类？')) return;
    await api.delete(`/categories/${id}`);
    loadMeta();
  };

  const deleteTag = async (id: string) => {
    if (!confirm('删除此标签？')) return;
    await api.delete(`/tags/${id}`);
    loadMeta();
  };

  const changePassword = async () => {
    try {
      await api.put('/auth/password', { oldPassword, newPassword });
      setOldPassword('');
      setNewPassword('');
      alert('密码已更新');
    } catch (err) {
      alert(err instanceof Error ? err.message : '修改失败');
    }
  };

  const exportWithAuth = async (format: 'json' | 'markdown') => {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'}/export/data?format=${format}`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      }
    );
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = format === 'json' ? 'anidiary-export.json' : 'anidiary-export.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold">设置</h2>

      <section className="bg-white rounded-xl border p-4 space-y-3">
        <h3 className="font-semibold">个人资料</h3>
        <p className="text-sm text-slate-500">{user?.email}</p>
        <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="昵称" />
        <Button onClick={saveProfile}>保存昵称</Button>
      </section>

      <section className="bg-white rounded-xl border p-4 space-y-3">
        <h3 className="font-semibold">修改密码</h3>
        <Input
          type="password"
          placeholder="原密码"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
        />
        <Input
          type="password"
          placeholder="新密码（至少 8 位）"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Button onClick={changePassword}>更新密码</Button>
      </section>

      <section className="bg-white rounded-xl border p-4 space-y-3">
        <h3 className="font-semibold">分类管理（纯手动）</h3>
        <div className="flex gap-2">
          <Input
            placeholder="新分类名"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <Button onClick={addCategory}>添加</Button>
        </div>
        <ul className="space-y-1">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between text-sm">
              <span style={{ color: c.color }}>{c.name}</span>
              <button onClick={() => deleteCategory(c.id)} className="text-red-500 text-xs">
                删除
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white rounded-xl border p-4 space-y-3">
        <h3 className="font-semibold">标签管理（纯手动）</h3>
        <div className="flex gap-2">
          <Input placeholder="新标签" value={newTag} onChange={(e) => setNewTag(e.target.value)} />
          <Button onClick={addTag}>添加</Button>
        </div>
        <ul className="space-y-1">
          {tags.map((t) => (
            <li key={t.id} className="flex items-center justify-between text-sm">
              <span>#{t.name}</span>
              <button onClick={() => deleteTag(t.id)} className="text-red-500 text-xs">
                删除
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white rounded-xl border p-4 space-y-3">
        <h3 className="font-semibold">数据导出</h3>
        <p className="text-xs text-slate-500">导出您的全部日记、分类、标签与影集数据</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportWithAuth('json')}>
            导出 JSON
          </Button>
          <Button variant="outline" onClick={() => exportWithAuth('markdown')}>
            导出 Markdown
          </Button>
        </div>
      </section>

      <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h3 className="font-semibold text-amber-800">功能说明</h3>
        <p className="text-sm text-amber-700 mt-2">
          AI 功能已剥离，待后续迭代。当前版本仅支持手动分类、标签与影集管理，不包含任何 AI 大模型、图像生成或智能推荐。
        </p>
      </section>

      <Button
        variant="destructive"
        onClick={async () => {
          await logout();
          navigate('/login');
        }}
      >
        退出登录
      </Button>
    </div>
  );
}
