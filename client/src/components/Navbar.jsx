import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Leaf, Sparkles } from 'lucide-react';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const links = [
    { to: '/', label: 'Home' },
    { to: '/magazine', label: 'Digital Magazine' },
    { to: '/explore', label: 'Explore Species' },
    { to: '/locations', label: 'Locations' },
    { to: '/about', label: 'About' },
  ];
  return (
    <header className="sticky top-0 z-50 bg-forest-dark/85 backdrop-blur-md text-cream border-b border-cream/10 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2.5 font-display font-bold text-xl tracking-wide group">
          <div className="w-8 h-8 rounded-full bg-forest border border-cream/20 flex items-center justify-center text-sage group-hover:border-sage transition shadow-sm">
            <Leaf className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </div>
          <span className="tracking-tight text-cream">
            BIO<span className="text-sage">DIVERSITY</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-7">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `text-xs font-semibold tracking-wider uppercase transition-all py-1 px-2 rounded-md ${
                  isActive
                    ? 'text-cream bg-white/10 shadow-sm border border-cream/20'
                    : 'text-cream/75 hover:text-cream hover:bg-white/5'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button
          className="md:hidden w-11 h-11 flex items-center justify-center rounded-xl text-cream/80 hover:text-cream hover:bg-white/10 active:bg-white/20 transition"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden bg-forest-dark/95 backdrop-blur-xl border-t border-cream/10 px-4 py-4 flex flex-col gap-1.5 animate-fade-in shadow-2xl">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `text-xs sm:text-sm font-semibold tracking-wider uppercase px-4 py-3 min-h-[44px] flex items-center rounded-xl transition ${
                  isActive
                    ? 'text-cream bg-white/15 border border-cream/20 font-bold shadow-xs'
                    : 'text-cream/75 hover:text-cream hover:bg-white/5 active:bg-white/10'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
