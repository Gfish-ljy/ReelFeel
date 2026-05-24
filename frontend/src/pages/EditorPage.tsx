import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { db } from '@/lib/db';
import { compressImage, blobToFile } from '@/lib/imageCompress';
import { useAuthStore } from '@/stores/authStore';
import { RichEditor } from '@/components/RichEditor';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Trash2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Tag {
  id: string;
  name: string;
}

function generateId() {
  return crypto.randomUUID();
}

export function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Category[]>('/categories'),
      api.get<Tag[]>('/tags'),
    ]).then(([c, t]) => {
      setCategories(c.data);
      setTags(t.data);
    });

    if (id) {
      api.get<{
        title: string;
        content: string;
        mood?: string;
        categories: Category[];
        tags: Tag[];
      }>(`/diaries/${id}`).then((res) => {
        setTitle(res.data.title);
        setContent(res.data.content);
        setMood(res.data.mood || '');
        setCategoryIds(res.data.categories?.map((c) => c.id) || []);
        setTagIds(res.data.tags?.map((t) => t.id) || []);
      });
    }
  }, [id]);

  const handleImageSelect = async (files: File[]) => {
    const compressed: File[] = [];
    for (const f of files) {
      const blob = await compressImage(f);
      compressed.push(blobToFile(blob, f.name.replace(/\.\w+$/, '.jpg')));
    }
    setPendingImages((prev) => [...prev, ...compressed]);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const body = { title, content, mood: mood || undefined, categoryIds, tagIds };

      if (!navigator.onLine) {
        const localId = generateId();
        await db.diaries.put({
          localId,
          userId: user.id,
          title,
          content,
          mood,
          categoryIds,
          tagIds,
          synced: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        navigate('/');
        return;
      }

      let diaryId = id;
      if (id) {
        await api.put(`/diaries/${id}`, body);
      } else {
        const res = await api.post<{ id: string }>('/diaries', body);
        diaryId = res.data.id;
      }

      if (pendingImages.length && diaryId) {
        const form = new FormData();
        pendingImages.forEach((f) => form.append('images', f));
        await api.upload(`/diaries/${diaryId}/images`, form);
      }

      navigate('/');
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!id || !confirm('确定删除这篇日记？')) return;
    await api.delete(`/diaries/${id}`);
    navigate('/');
  };

  const toggleCategory = (cid: string) => {
    setCategoryIds((prev) =>
      prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]
    );
  };

  const toggleTag = (tid: string) => {
    setTagIds((prev) =>
      prev.includes(tid) ? prev.filter((x) => x !== tid) : [...prev, tid]
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{id ? '编辑日记' : '新日记'}</h2>
        {id && (
          <Button variant="destructive" size="sm" onClick={remove}>
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <Input
          placeholder="标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-medium"
        />
        <Input
          placeholder="心情（可选）"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
        />

        <div>
          <p className="text-sm font-medium mb-2">分类</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCategory(c.id)}
                className="text-xs px-3 py-1 rounded-full border transition-colors"
                style={{
                  backgroundColor: categoryIds.includes(c.id) ? c.color : 'transparent',
                  color: categoryIds.includes(c.id) ? '#fff' : c.color,
                  borderColor: c.color,
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">标签</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                className={`text-xs px-3 py-1 rounded-full border ${
                  tagIds.includes(t.id) ? 'bg-slate-800 text-white border-slate-800' : 'bg-white'
                }`}
              >
                #{t.name}
              </button>
            ))}
          </div>
        </div>

        <RichEditor
          content={content}
          onChange={setContent}
          onImageSelect={handleImageSelect}
        />

        {pendingImages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pendingImages.map((f, i) => (
              <img
                key={i}
                src={URL.createObjectURL(f)}
                alt=""
                className="w-16 h-16 object-cover rounded"
              />
            ))}
            <p className="text-xs text-slate-500 w-full">
              {pendingImages.length} 张图片待上传（已压缩至 1920px 宽）
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={save} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)}>
            取消
          </Button>
        </div>
      </div>
    </div>
  );
}
