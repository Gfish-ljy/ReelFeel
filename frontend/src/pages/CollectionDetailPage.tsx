import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CollectionDetail {
  id: string;
  name: string;
  description?: string;
  items: {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    images?: { imageUrl: string; thumbnailUrl?: string }[];
    sortOrder: number;
  }[];
}

export function CollectionDetailPage() {
  const { id } = useParams();
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    if (id) {
      api.get<CollectionDetail>(`/collections/${id}`).then((res) => setCollection(res.data));
    }
  }, [id]);

  if (!collection) {
    return <p className="p-6 text-slate-500">加载中...</p>;
  }

  const items = collection.items;
  const current = items[slideIndex];

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <Link to="/collections" className="text-sm text-primary hover:underline mb-4 inline-block">
        ← 返回影集列表
      </Link>
      <h2 className="text-2xl font-bold mb-2">{collection.name}</h2>
      {collection.description && (
        <p className="text-slate-600 mb-6">{collection.description}</p>
      )}

      {items.length === 0 ? (
        <p className="text-slate-500">影集为空，从日记编辑页或时间轴添加日记</p>
      ) : (
        <>
          <div className="bg-white rounded-xl border p-6 min-h-[300px]">
            {current.images?.[0] && (
              <img
                src={current.images[0].imageUrl}
                alt=""
                loading="lazy"
                className="w-full max-h-64 object-cover rounded-lg mb-4"
              />
            )}
            <h3 className="text-xl font-semibold">{current.title}</h3>
            <time className="text-sm text-slate-500">
              {format(new Date(current.createdAt), 'yyyy-MM-dd')}
            </time>
            <div
              className="prose prose-slate mt-4"
              dangerouslySetInnerHTML={{ __html: current.content }}
            />
          </div>

          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              disabled={slideIndex === 0}
              onClick={() => setSlideIndex((i) => i - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
              上一篇
            </Button>
            <span className="text-sm text-slate-500">
              {slideIndex + 1} / {items.length}
            </span>
            <Button
              variant="outline"
              disabled={slideIndex >= items.length - 1}
              onClick={() => setSlideIndex((i) => i + 1)}
            >
              下一篇
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
            {items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => setSlideIndex(i)}
                className={`shrink-0 w-24 p-2 rounded-lg border text-left text-xs ${
                  i === slideIndex ? 'border-primary bg-primary/5' : 'bg-white'
                }`}
              >
                <p className="font-medium truncate">{item.title || '无标题'}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
