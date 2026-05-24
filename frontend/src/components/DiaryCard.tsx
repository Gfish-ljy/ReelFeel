import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export interface DiaryListItem {
  id: string;
  title: string;
  content: string;
  mood?: string | null;
  createdAt: string;
  images?: { thumbnailUrl?: string | null; imageUrl: string }[];
  categories?: { id: string; name: string; color: string }[];
  tags?: { id: string; name: string }[];
}

export function DiaryCard({ diary }: { diary: DiaryListItem }) {
  const preview = diary.content.replace(/<[^>]+>/g, '').slice(0, 120);
  const thumb = diary.images?.[0]?.thumbnailUrl || diary.images?.[0]?.imageUrl;

  return (
    <Link
      to={`/editor/${diary.id}`}
      className="block bg-white rounded-xl border p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex gap-4">
        {thumb && (
          <img
            src={thumb}
            alt=""
            loading="lazy"
            className="w-20 h-20 object-cover rounded-lg shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <time className="text-xs text-slate-500">
              {format(new Date(diary.createdAt), 'yyyy年M月d日 EEEE', { locale: zhCN })}
            </time>
            {diary.mood && (
              <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{diary.mood}</span>
            )}
          </div>
          <h3 className="font-semibold truncate">{diary.title || '无标题'}</h3>
          <p className="text-sm text-slate-600 line-clamp-2 mt-1">{preview}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {diary.categories?.map((c) => (
              <span
                key={c.id}
                className="text-xs px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: c.color }}
              >
                {c.name}
              </span>
            ))}
            {diary.tags?.map((t) => (
              <span key={t.id} className="text-xs px-2 py-0.5 rounded-full bg-slate-100">
                #{t.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
