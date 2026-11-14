import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Leaf, Eye, EyeOff, AlertCircle, Lock } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/secure-admin-portal');
    } catch (err) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-forest-dark flex items-center justify-center p-4 overflow-hidden">
      {/* Cinematic Nature Background Backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src="/images/hero-forest.jpg"
          alt=""
          className="w-full h-full object-cover filter brightness-[0.35] contrast-[1.15] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-dark/95 via-forest/80 to-forest-dark" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 50% 50%, rgba(20,40,30,0.4) 0%, rgba(10,22,16,0.95) 100%)',
          }}
        />
      </div>

      <div className="relative z-10 bg-forest-dark/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 w-full max-w-md border border-cream/15 text-cream">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-forest rounded-2xl flex items-center justify-center mx-auto mb-4 text-sage shadow-xl border border-cream/15">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-cream">
            BIO<span className="text-sage">DIVERSITY</span>
          </h1>
          <p className="text-sage text-xs uppercase tracking-widest font-mono font-semibold mt-1">
            Restricted Administrator Studio
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-950/60 border border-red-500/40 text-red-200 px-4 py-3 rounded-xl text-sm mb-6">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-cream/70 mb-2">
              Administrator Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full border border-cream/20 rounded-xl px-4 py-3.5 bg-black/40 text-cream focus:outline-none focus:ring-2 focus:ring-earth text-sm font-medium placeholder:text-cream/30 transition shadow-inner"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-cream/70 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-cream/20 rounded-xl px-4 py-3.5 pr-12 bg-black/40 text-cream focus:outline-none focus:ring-2 focus:ring-earth text-sm font-medium placeholder:text-cream/30 transition shadow-inner"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cream/50 hover:text-cream transition"
              >
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-earth hover:bg-earth-dark text-cream font-semibold py-3.5 rounded-xl transition-all hover:scale-[1.02] shadow-xl disabled:opacity-50 text-sm tracking-wider uppercase border border-cream/10 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-cream/10 text-center">
          <p className="text-[11px] text-cream/40 font-mono">
            Authorized Research Personnel Only &bull; Dual Database Engine
          </p>
        </div>
      </div>
    </div>
  );
}

