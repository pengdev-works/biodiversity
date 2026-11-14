import { Link } from 'react-router-dom';
import { Leaf, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <Leaf className="w-16 h-16 text-sage/40 mx-auto mb-6" />
        <h1 className="font-display text-8xl font-bold text-forest/20 mb-2">404</h1>
        <h2 className="font-display text-2xl font-bold text-forest mb-2">Page Not Found</h2>
        <p className="text-forest/60 text-sm mb-8 font-editorial italic">
          This trail leads into uncharted wilderness. The page you are looking for does not exist.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-forest hover:bg-forest-light text-cream px-6 py-3 rounded-full text-sm font-medium transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Home
        </Link>
      </div>
    </div>
  );
}

