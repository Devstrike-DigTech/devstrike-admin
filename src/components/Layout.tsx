import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearToken } from '../lib/api';

const NAV = [
  { to: '/projects', label: 'Projects' },
  { to: '/vacancies', label: 'Vacancies' },
  { to: '/team', label: 'Team' },
  { to: '/posts', label: 'Posts' },
  { to: '/applications', label: 'Applications' },
  { to: '/messages', label: 'Messages' },
];

export default function Layout() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col bg-ink text-white">
        <div className="px-5 py-6">
          <p className="text-lg font-extrabold">
            Devstrike{' '}
            <span className="bg-gradient-to-r from-pink-400 to-indigo-400 bg-clip-text text-transparent">
              Admin
            </span>
          </p>
          <p className="mt-1 text-xs text-gray-400">Content management</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => {
            clearToken();
            navigate('/login');
          }}
          className="m-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white"
        >
          Log out
        </button>
      </aside>

      <main className="min-w-0 flex-1 p-6 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
}
