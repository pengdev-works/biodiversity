import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Globe2, ChevronRight, Leaf } from 'lucide-react';

// Fix default leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Deterministic coordinates generator for locations without explicit lat/lon
function getCoords(name, index) {
  // Center around Philippine biodiversity regions / Southeast Asia
  const baseLat = 13.0;
  const baseLng = 122.0;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = ((Math.abs(hash) % 700) - 350) / 100;
  const lngOffset = ((Math.abs(hash >> 3) % 700) - 350) / 100;
  return [baseLat + latOffset, baseLng + lngOffset];
}

export default function LocationsPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoc, setSelectedLoc] = useState(null);

  useEffect(() => {
    fetch('/api/public/locations')
      .then(res => res.json())
      .then(data => {
        const locs = (data.locations || []).map((loc, idx) => ({
          ...loc,
          coords: getCoords(loc.location, idx),
        }));
        setLocations(locs);
        if (locs.length > 0) setSelectedLoc(locs[0]);
      })
      .catch(() => setLocations([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Header with Hero Nature Backdrop */}
      <section className="relative bg-forest-dark text-cream py-20 px-4 overflow-hidden border-b border-cream/10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src="/images/hero-forest.jpg"
            alt=""
            className="w-full h-full object-cover filter brightness-[0.45] contrast-[1.1] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-forest-dark/90 via-forest/75 to-forest-dark" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-cream/20 text-sage text-xs uppercase tracking-widest font-semibold mb-3 shadow-lg">
            <Globe2 className="w-3.5 h-3.5 text-sage" /> Geographic Exploration
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight mb-3 drop-shadow-md">
            Documented Locations
          </h1>
          <p className="font-editorial italic text-cream/80 text-base sm:text-lg max-w-xl leading-relaxed">
            Explore biodiversity distribution across field survey sites, natural reserves, and regional habitats.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex flex-col lg:flex-row gap-6 sm:gap-8">
        {/* Sidebar: Location list */}
        <div className="lg:w-1/3 bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-forest/10 flex flex-col h-[340px] sm:h-[400px] lg:h-[600px]">
          <h2 className="font-display text-lg sm:text-xl font-bold text-forest mb-3 sm:mb-4 flex items-center justify-between">
            <span>Survey Locations</span>
            <span className="text-xs bg-cream text-forest px-2.5 py-1 rounded-full font-mono">
              {locations.length}
            </span>
          </h2>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Leaf className="w-8 h-8 text-sage animate-spin" />
            </div>
          ) : locations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-forest/50">
              <MapPin className="w-12 h-12 text-sage/40 mb-3" />
              <p className="font-medium text-sm">No locations recorded yet</p>
              <p className="text-xs text-forest/40 mt-1">
                Documented survey sites will appear here as species are published.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {locations.map(loc => (
                <div
                  key={loc.location}
                  onClick={() => setSelectedLoc(loc)}
                  className={`p-4 rounded-xl cursor-pointer border transition-all ${
                    selectedLoc?.location === loc.location
                      ? 'border-earth bg-cream/60 shadow-sm'
                      : 'border-forest/5 hover:border-forest/20 hover:bg-cream/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin className={`w-4 h-4 shrink-0 ${selectedLoc?.location === loc.location ? 'text-earth' : 'text-forest/40'}`} />
                      <h3 className="font-medium text-forest text-sm">{loc.location}</h3>
                    </div>
                    <span className="text-xs bg-forest/10 text-forest px-2 py-0.5 rounded-full font-semibold shrink-0">
                      {loc.species_count} {loc.species_count === 1 ? 'species' : 'species'}
                    </span>
                  </div>
                  <div className="mt-3 text-right">
                    <Link
                      to={`/explore?search=${encodeURIComponent(loc.location)}`}
                      className="text-xs text-earth hover:text-earth-dark font-medium inline-flex items-center gap-1"
                    >
                      View species <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="lg:w-2/3 h-[380px] sm:h-[460px] lg:h-[600px] bg-cream rounded-2xl overflow-hidden shadow-sm border border-forest/10 relative">
          <MapContainer
            center={[12.8797, 121.7740]}
            zoom={6}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locations.map(loc => (
              <Marker key={loc.location} position={loc.coords}>
                <Popup>
                  <div className="p-1">
                    <h4 className="font-display font-bold text-forest text-sm mb-1">{loc.location}</h4>
                    <p className="text-xs text-forest/70 mb-2">
                      {loc.species_count} documented species
                    </p>
                    <Link
                      to={`/explore?search=${encodeURIComponent(loc.location)}`}
                      className="text-xs bg-forest text-cream px-3 py-1.5 rounded-full font-medium inline-block hover:bg-forest-light"
                    >
                      Browse Species
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

