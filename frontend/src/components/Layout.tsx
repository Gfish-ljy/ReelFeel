import { Link, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, Calendar, FolderOpen, Settings, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { to: '/', icon: BookOpen, label: '时间轴' },
  { to: '/calendar', icon: Calendar, label: '日历' },
  { to: '/collections', icon: FolderOpen, label: '影集' },
  { to: '/settings', icon: Settings, label: '设置' },
];

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-56 border-b md:border-b-0 md:border-r bg-white shrink-0">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-primary">漫日记</h1>
          <p className="text-xs text-slate-500">AniDiary</p>
        </div>
        <nav className="flex md:flex-col p-2 gap-1 overflow-x-auto">
          {nav.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap',
                location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:block p-4">
          <Link
            to="/editor"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-indigo-600"
          >
            <Plus className="w-4 h-4" />
            写日记
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      <Link
        to="/editor"
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center"
        aria-label="写日记"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}
