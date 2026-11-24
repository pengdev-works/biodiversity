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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header Bar */}
        <header className="md:hidden bg-forest-dark text-cream px-4 py-3.5 flex items-center justify-between border-b border-cream/10 shrink-0 z-30 shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-forest border border-cream/20 flex items-center justify-center text-sage">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <span className="font-display font-bold text-base leading-none block">BIODIVERSITY</span>
              <span className="text-[9px] text-sage font-mono tracking-widest uppercase">Admin Studio</span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-cream hover:bg-white/10 active:bg-white/20 transition"
            aria-label="Toggle admin navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Slide-Over Drawer with Backdrop */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer Content */}
            <div className="relative w-72 max-w-[80vw] bg-forest-dark text-cream h-full flex flex-col shadow-2xl z-10 border-r border-cream/10">
              <div className="p-5 border-b border-cream/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Leaf className="w-5 h-5 text-sage" />
                  <span className="font-display font-bold text-base">BIODIVERSITY</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-cream/70 hover:text-cream hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nav links with 44px touch targets */}
              <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                {navItems.map(({ to, icon: Icon, label, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition min-h-[44px] ${
                        isActive
                          ? 'bg-sage text-cream shadow-xs font-semibold'
                          : 'text-cream/75 hover:text-cream hover:bg-white/5 active:bg-white/10'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </nav>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-cream/10 bg-forest-dark/95">
                <div className="px-3 py-2 mb-2 bg-white/5 rounded-xl">
                  <p className="text-xs font-semibold text-cream truncate">{user.username}</p>
                  <p className="text-[10px] text-cream/50 truncate capitalize">{user.role || 'Administrator'}</p>
                </div>

                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-cream/70 hover:text-cream hover:bg-white/5 transition mb-1 min-h-[40px]"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Public Site
                </a>

                <button
                  onClick={() => {
                    logout();
                    navigate('/secure-admin-portal/login');
                  }}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 w-full transition min-h-[40px]"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable page body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-paper">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

