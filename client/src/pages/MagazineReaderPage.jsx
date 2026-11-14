import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Leaf, AlertCircle } from 'lucide-react';
import FlipBook from '../components/FlipBook.jsx';
import { api } from '../utils/api';

export default function MagazineReaderPage() {
  const [magazine, setMagazine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/magazine/public')
      .then(data => {
        if (data.publication) {
          setMagazine({
            ...data.publication,
            pages: data.pages || []
          });
        } else {
          setMagazine(null);
        }
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-forest-dark flex items-center justify-center text-cream">
        <div className="text-center">
          <Leaf className="w-12 h-12 text-sage animate-spin mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-1">Opening Digital Magazine...</h2>
          <p className="text-cream/60 text-sm">Preparing high-resolution spreads and bindings</p>
        </div>
      </div>
    );
  }

  if (error || !magazine) {
    return (
      <div className="min-h-screen bg-forest-dark flex items-center justify-center text-cream px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-forest flex items-center justify-center mx-auto mb-6 text-sage">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-3">No Active Publication</h1>
          <p className="text-cream/70 text-sm mb-8 leading-relaxed font-editorial italic">
            The administrator has not published a magazine edition yet. When an edition is released, the realistic page-turning flipbook will appear here.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-earth hover:bg-earth-dark text-cream px-6 py-3 rounded-full text-sm font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-forest-dark select-none">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 z-40">
        <Link
          to="/"
          className="flex items-center gap-2 bg-forest/80 backdrop-blur-md hover:bg-forest text-cream px-4 py-2 rounded-full text-xs font-medium border border-cream/10 transition shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Website
        </Link>
      </div>

      {/* FlipBook Core */}
      <FlipBook magazine={magazine} />
    </div>
  );
}

