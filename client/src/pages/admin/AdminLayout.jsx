import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutDashboard,
  Dna,
  FolderOpen,
  Image as ImageIcon,
  Box,
  BookOpen,
  Users,
  LogOut,
  Leaf,
  Menu,
  X,
  ExternalLink
} from 'lucide-react';

const navItems = [
  { to: '/secure-admin-portal', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/secure-admin-portal/species', icon: Dna, label: 'Species Catalog' },
  { to: '/secure-admin-portal/categories', icon: FolderOpen, label: 'Categories' },
  { to: '/secure-admin-portal/photos', icon: ImageIcon, label: 'Photo Library' },
  { to: '/secure-admin-portal/models', icon: Box, label: '3D Models' },
  { to: '/secure-admin-portal/magazine', icon: BookOpen, label: 'Magazine Builder' },
  { to: '/secure-admin-portal/contributors', icon: Users, label: 'Manage Contributors' },
];

export default function AdminLayout() {
  const auth = useAuth() || {};
  const user = auth.user;
  const loading = auth.loading;
  const logout = auth.logout || (() => {});
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/secure-admin-portal/login');
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-forest-dark flex items-center justify-center">
        <Leaf className="w-10 h-10 text-sage animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-paper overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-forest-dark text-cream border-r border-cream/10 shrink-0">
        <div className="p-6 border-b border-cream/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Leaf className="w-6 h-6 text-sage" />
            <div>
              <h1 className="font-display font-bold text-lg leading-tight tracking-wide">
                BIODIVERSITY
              </h1>
              <span className="text-[10px] text-sage uppercase tracking-widest font-mono">
                Admin Studio
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sage text-cream shadow-sm'
                    : 'text-cream/70 hover:text-cream hover:bg-cream/5'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer profile & actions */}
        <div className="p-4 border-t border-cream/10 bg-forest-dark/80">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-semibold text-cream truncate">{user.username}</p>
            <p className="text-[10px] text-cream/50 truncate capitalize">{user.role || 'Administrator'}</p>
          </div>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-cream/60 hover:text-cream hover:bg-cream/5 transition mb-1"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View Public Site
          </a>

          <button
            onClick={() => {
              logout();
              navigate('/secure-admin-portal/login');
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 w-full transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="md:hidden bg-forest text-cream px-4 py-3 flex items-center justify-between border-b border-forest-light shrink-0">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-sage" />
            <span className="font-display font-bold text-base">BIODIVERSITY</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-cream hover:bg-forest-light transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-forest-dark text-cream p-4 space-y-2 border-b border-cream/10">
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-sage text-cream' : 'text-cream/70 hover:bg-cream/5'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </NavLink>
            ))}
            <div className="pt-2 border-t border-cream/10">
              <button
                onClick={() => {
                  logout();
                  navigate('/secure-admin-portal/login');
                }}
                className="flex items-center gap-3 px-3 py-2 text-sm text-rose-300 w-full"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Scrollable page body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-paper">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

