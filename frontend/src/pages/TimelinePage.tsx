import { useCallback, useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import { DiaryCard, type DiaryListItem } from '@/components/DiaryCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ListResponse {
  items: DiaryListItem[];
  total: number;
  page: number;
  limit: number;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Tag {
  id: string;
  name: string;
}

export function TimelinePage() {
  const [diaries, setDiaries] = useState<DiaryListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [tag, setTag] = useState('');
  const [loading, setLoading] = useState(true);
  const parentRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (keyword) params.set('keyword', keyword);
      if (category) params.set('category', category);
      if (tag) params.set('tag', tag);
      const [diaryRes, catRes, tagRes] = await Promise.all([
        api.get<ListResponse>(`/diaries?${params}`),
        api.get<Category[]>('/categories'),
        api.get<Tag[]>('/tags'),
      ]);
      setDiaries(diaryRes.data.items);
      setCategories(catRes.data);
      setTags(tagRes.data);
    } finally {
      setLoading(false);
    }
  }, [keyword, category, tag]);

  useEffect(() => {
    load();
  }, [load]);

  const useVirtual = diaries.length > 100;
  const virtualizer = useVirtualizer({
    count: diaries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140,
    enabled: useVirtual,
  });

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">时间轴</h2>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="搜索关键词..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
        >
          <option value="">全部分类</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
        >
          <option value="">全部标签</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <Button variant="outline" onClick={load}>筛选</Button>
      </div>

      {loading ? (
        <p className="text-slate-500 text-center py-12">加载中...</p>
      ) : diaries.length === 0 ? (
        <p className="text-slate-500 text-center py-12">还没有日记，开始写第一篇吧</p>
      ) : useVirtual ? (
        <div ref={parentRef} className="h-[calc(100vh-220px)] overflow-auto">
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((vItem) => (
              <div
                key={vItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${vItem.start}px)`,
                }}
                className="pb-3"
              >
                <DiaryCard diary={diaries[vItem.index]} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {diaries.map((d) => (
            <DiaryCard key={d.id} diary={d} />
          ))}
        </div>
      )}
    </div>
  );
}
