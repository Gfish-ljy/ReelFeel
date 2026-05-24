import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { format } from 'date-fns';

interface Collection {
  id: string;
  name: string;
}

interface CollectionDetail {
  id: string;
  name: string;
  items: { id: string; title: string; content: string; createdAt: string }[];
}

export function ComparePage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');
  const [left, setLeft] = useState<CollectionDetail | null>(null);
  const [right, setRight] = useState<CollectionDetail | null>(null);

  useEffect(() => {
    api.get<Collection[]>('/collections').then((res) => setCollections(res.data));
  }, []);

  useEffect(() => {
    if (leftId) {
      api.get<CollectionDetail>(`/collections/${leftId}`).then((res) => setLeft(res.data));
    } else setLeft(null);
  }, [leftId]);

  useEffect(() => {
    if (rightId) {
      api.get<CollectionDetail>(`/collections/${rightId}`).then((res) => setRight(res.data));
    } else setRight(null);
  }, [rightId]);

  const renderPanel = (col: CollectionDetail | null, side: string) => (
    <div className="flex-1 min-w-0 border rounded-xl bg-white overflow-hidden">
      <div className="p-3 border-b bg-slate-50 font-medium">
        {col ? col.name : `选择影集 (${side})`}
      </div>
      <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
        {col?.items.map((item) => (
          <div key={item.id} className="border rounded-lg p-3">
            <h4 className="font-medium text-sm">{item.title || '无标题'}</h4>
            <time className="text-xs text-slate-500">
              {format(new Date(item.createdAt), 'yyyy-MM-dd')}
            </time>
            <p className="text-sm text-slate-600 mt-1 line-clamp-3">
              {item.content.replace(/<[^>]+>/g, '')}
            </p>
          </div>
        ))}
        {col && col.items.length === 0 && (
          <p className="text-sm text-slate-400">影集为空</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      <Link to="/collections" className="text-sm text-primary hover:underline mb-4 inline-block">
        ← 返回影集
      </Link>
      <h2 className="text-2xl font-bold mb-4">时光对比</h2>
      <p className="text-sm text-slate-500 mb-4">
        左右分栏对比两个影集（纯前端展示，不涉及 AI 生成）
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <select
          value={leftId}
          onChange={(e) => setLeftId(e.target.value)}
          className="flex-1 h-10 rounded-lg border px-3 text-sm"
        >
          <option value="">左侧影集</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={rightId}
          onChange={(e) => setRightId(e.target.value)}
          className="flex-1 h-10 rounded-lg border px-3 text-sm"
        >
          <option value="">右侧影集</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {renderPanel(left, '左')}
        {renderPanel(right, '右')}
      </div>
    </div>
  );
}
