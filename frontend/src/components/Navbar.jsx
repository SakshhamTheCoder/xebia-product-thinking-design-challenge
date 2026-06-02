import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button, LevelChip, BrandMark } from './ui';

const LINKS = {
  learner: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/quests', label: 'Quests' },
    { to: '/leaderboard', label: 'Leaderboard' },
  ],
  mentor: [
    { to: '/mentor', label: 'Mentor' },
    { to: '/quests', label: 'Quests' },
    { to: '/leaderboard', label: 'Leaderboard' },
  ],
  admin: [
    { to: '/admin', label: 'Admin' },
    { to: '/quests', label: 'Quests' },
    { to: '/leaderboard', label: 'Leaderboard' },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const links = user ? LINKS[user.role] || [] : [];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2.5">
            <BrandMark size="sm" />
            <span className="text-base font-bold tracking-tight text-emerald-800">
              LearnHub
            </span>
          </div>

          {links.length > 0 && (
            <nav className="hidden items-center gap-1 sm:flex">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-emerald-900'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-3">
            {user.role === 'learner' && <LevelChip level={user.level} />}
            <span className="hidden text-sm text-slate-600 sm:inline">
              {user.username}
            </span>
            <Button variant="secondary" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
