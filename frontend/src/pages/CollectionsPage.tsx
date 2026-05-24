import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, GitCompare } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Collection {
  id: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  itemCount: number;
}

export function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const load = () => {
    api.get<Collection[]>('/collections').then((res) => setCollections(res.data));
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!name.trim()) return;
    await api.post('/collections', { name, description });
    setName('');
    setDescription('');
    setShowForm(false);
    load();
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">影集</h2>
        <div className="flex gap-2">
          <Link to="/collections/compare">
            <Button variant="outline" size="sm">
              <GitCompare className="w-4 h-4 mr-1" />
              时光对比
            </Button>
          </Link>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-1" />
            新建
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border rounded-xl p-4 mb-6 space-y-3">
          <Input placeholder="影集名称" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            placeholder="描述（可选）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button onClick={create}>创建</Button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {collections.map((col) => (
          <Link
            key={col.id}
            to={`/collections/${col.id}`}
            className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow"
          >
            {col.coverImageUrl ? (
              <img src={col.coverImageUrl} alt="" className="w-full h-32 object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-32 bg-gradient-to-br from-indigo-100 to-slate-100" />
            )}
            <div className="p-4">
              <h3 className="font-semibold">{col.name}</h3>
              {col.description && (
                <p className="text-sm text-slate-500 line-clamp-2 mt-1">{col.description}</p>
              )}
              <p className="text-xs text-slate-400 mt-2">{col.itemCount} 篇日记</p>
            </div>
          </Link>
        ))}
      </div>

      {collections.length === 0 && (
        <p className="text-center text-slate-500 py-12">还没有影集，从日记中手动挑选创建吧</p>
      )}
    </div>
  );
}
