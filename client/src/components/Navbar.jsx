import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Leaf, User, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const links = [
    { to: '/', label: 'Home' },
    { to: '/explore', label: 'Biodiversity' },
    { to: '/locations', label: 'Locations' },
    { to: '/about', label: 'About' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#163a2b]/95 backdrop-blur-md text-cream border-b border-cream/10 shadow-lg transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-18">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-[#0e2a1e] border border-emerald-400/30 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <Leaf className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-xl tracking-tight text-white leading-tight">
              BIO<span className="text-emerald-400">DIVERSITY</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-emerald-200/80 font-medium">
              Explore • Learn • Preserve
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `text-xs font-semibold tracking-wider uppercase transition-all py-2 px-4 rounded-full ${
                  isActive
                    ? 'text-white bg-emerald-600/50 shadow-sm border border-emerald-400/30 font-bold'
                    : 'text-cream/80 hover:text-white hover:bg-white/10'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Right side admin icon */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            to="/secure-admin-portal/login"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-emerald-600 text-cream/90 hover:text-white border border-cream/20 flex items-center justify-center transition shadow-sm"
            title="Admin Portal"
          >
            <User className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden w-11 h-11 flex items-center justify-center rounded-xl text-cream/90 hover:text-white hover:bg-white/10 active:bg-white/20 transition"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="md:hidden bg-[#163a2b]/98 backdrop-blur-xl border-t border-cream/10 px-4 py-4 flex flex-col gap-2 animate-fade-in shadow-2xl">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `text-sm font-semibold tracking-wider uppercase px-4 py-3 rounded-xl flex items-center justify-between transition ${
                  isActive
                    ? 'text-white bg-emerald-600/60 font-bold border border-emerald-400/30'
                    : 'text-cream/80 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <span>{l.label}</span>
            </NavLink>
          ))}
          <Link
            to="/secure-admin-portal/login"
            onClick={() => setOpen(false)}
            className="text-xs font-semibold uppercase px-4 py-3 rounded-xl bg-white/10 hover:bg-emerald-600 text-cream flex items-center gap-2 mt-2 transition"
          >
            <User className="w-4 h-4" /> Admin Portal
          </Link>
        </div>
      )}
    </header>
  );
}
