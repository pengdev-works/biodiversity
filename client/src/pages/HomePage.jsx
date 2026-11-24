import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Leaf, ChevronRight, Globe2, Camera, Dna, Users, Sparkles, Mail, Github, Linkedin, Code2, GraduationCap, Box } from 'lucide-react';
import { api, getImageUrl } from '../utils/api';
import InteractiveSpeciesCard from '../components/InteractiveSpeciesCard';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [allSpecies, setAllSpecies] = useState([]);
  const [magazine, setMagazine] = useState(null);
  const [bsitContributors, setBsitContributors] = useState([]);
  const [btledContributors, setBtledContributors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/api/public/featured'),
      api.get('/api/public/species?limit=30'),
      api.get('/api/magazine/public'),
      api.get('/api/public/contributors')
    ]).then(([feat, spec, mag, contribRes]) => {
      if (feat.status === 'fulfilled') setFeatured(feat.value?.species || []);
      if (spec.status === 'fulfilled') setAllSpecies(spec.value?.species || []);
      if (mag.status === 'fulfilled') setMagazine(mag.value?.publication || null);
      if (contribRes.status === 'fulfilled') {
        setBsitContributors(contribRes.value?.bsit || []);
        setBtledContributors(contribRes.value?.btled || []);
      }
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-forest">
        {/* Cinematic Background Image with Dark Vignette Overlay */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={getImageUrl(magazine?.cover_photo_url) || "/images/hero-forest.jpg"}
            alt="Biodiversity Natural Habitat"
            className="w-full h-full object-cover object-center filter brightness-[0.70] contrast-[1.08] scale-105 transition-transform duration-1000"
          />
          {/* Atmospheric editorial gradients ensuring text legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-forest-dark/85 via-forest/60 to-forest-dark/95" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(ellipse at 50% 40%, rgba(20,40,30,0.2) 0%, rgba(10,22,16,0.85) 100%)',
            }}
          />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in pt-16 sm:pt-0">
          {/* Institutional Brand Crest */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white p-1 shadow-2xl border-2 border-emerald-400/50 mb-3 hover:scale-105 transition-transform">
              <img
                src="/images/university-of-abra-seal.png"
                alt="University of Abra Official Seal"
                className="w-full h-full object-contain"
              />
            </div>
            <img
              src="/images/uabiosphere-text-logo.png"
              alt="UABioSphere"
              className="h-14 sm:h-20 object-contain filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
            />
          </div>

          {/* Floating Pill Badge */}
          <div className="inline-flex items-center gap-2.5 sm:gap-3 bg-black/40 backdrop-blur-md border border-cream/20 px-3.5 sm:px-4 py-1.5 rounded-full mb-6 text-cream/90 text-xs shadow-xl max-w-full">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <Leaf className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-emerald-300 text-[10px] sm:text-xs font-semibold tracking-widest uppercase truncate">
              University of Abra • Natural Sciences Research Portal
            </span>
          </div>

          <p className="text-cream/90 text-base sm:text-xl md:text-2xl font-editorial italic mb-8 sm:mb-10 max-w-2xl mx-auto drop-shadow-md leading-relaxed px-2">
            Discover the Hidden World of Living Nature & Ecological Heritage in Abra
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full max-w-md mx-auto sm:max-w-none">
            <Link
              to="/explore"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1b4332] hover:bg-[#2d6a4f] text-white px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-bold transition-all shadow-xl hover:scale-102 text-sm sm:text-base border border-emerald-400/30"
            >
              <Leaf className="w-5 h-5 shrink-0" /> Explore Species Catalog
            </Link>
            <Link
              to="/about"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-black/40 backdrop-blur-md border-2 border-cream/30 text-cream px-7 sm:px-9 py-3.5 sm:py-4 rounded-full font-semibold hover:bg-white/10 active:scale-95 transition-all shadow-lg text-sm sm:text-base"
            >
              <Globe2 className="w-5 h-5 shrink-0" /> About The Project
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
          <div className="w-6 h-10 border-2 border-cream/50 rounded-full flex justify-center pt-2 backdrop-blur-sm bg-black/20">
            <div className="w-1 h-3 bg-cream/80 rounded-full" />
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-forest-dark border-y border-cream/10 py-10 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 50% 50%, rgba(117,139,112,0.3) 0%, transparent 70%)',
          }}
        />
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center relative z-10">
          {[
            { icon: <Dna className="w-5 h-5 text-emerald-400" />, label: 'Species Documented', val: 'Taxa Records' },
            { icon: <Camera className="w-5 h-5 text-emerald-400" />, label: 'Photographs', val: 'Macro & Habitat' },
            { icon: <Box className="w-5 h-5 text-emerald-400" />, label: '3D Specimen Models', val: 'Interactive 360°' },
          ].map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/[0.03] border border-cream/5 hover:border-cream/15 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-forest flex items-center justify-center text-sage border border-cream/10 shadow-inner">
                {s.icon}
              </div>
              <p className="font-display font-bold text-cream text-base tracking-wide mt-1">{s.label}</p>
              <p className="text-[11px] text-cream/50 uppercase tracking-widest font-mono">{s.val}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Species */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sage/15 border border-sage/30 text-sage text-xs uppercase tracking-widest font-semibold mb-2">
              <Leaf className="w-3.5 h-3.5" /> Curated Field Dossier
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-forest tracking-tight">
              Notable Specimens
            </h2>
          </div>
          {featured.length > 0 && (
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 text-earth hover:text-earth-dark font-semibold text-sm transition-all group"
            >
              <span>Explore Complete Catalog</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
        {featured.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-sage/30 rounded-3xl bg-cream/30">
            <div className="w-16 h-16 rounded-full bg-forest/5 flex items-center justify-center mx-auto mb-4 text-sage">
              <Leaf className="w-8 h-8" />
            </div>
            <h3 className="font-display text-2xl text-forest font-semibold mb-2">
              Biodiversity Awaits Documentation
            </h3>
            <p className="text-forest/60 text-sm max-w-md mx-auto">
              Featured species will appear here once the field research team publishes catalog records.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featured.map((sp) => (
              <Link
                key={sp.id}
                to={`/explore/${sp.id}`}
                className="group relative flex flex-col overflow-hidden rounded-3xl bg-white border border-forest/10 hover:border-earth/40 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5"
              >
                <div className="aspect-[4/3] bg-forest-dark relative overflow-hidden flex items-center justify-center">
                  <div className="w-full h-full flex items-center justify-center bg-forest-dark absolute inset-0">
                    <Leaf className="w-14 h-14 text-sage/30" />
                  </div>
                  {sp.cover_photo_url ? (
                    <img
                      src={getImageUrl(sp.cover_photo_url)}
                      alt={sp.common_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out relative z-1"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity z-2 pointer-events-none" />

                  {/* Category Pill Tag */}
                  <span className="absolute top-4 left-4 bg-forest-dark/80 backdrop-blur-md text-cream text-[10px] uppercase tracking-widest font-semibold px-3 py-1 rounded-full border border-cream/20 shadow-md">
                    {sp.category_name || 'Specimen'}
                  </span>

                  {/* Conservation status on card */}
                  {sp.conservation_status && (
                    <span className="absolute bottom-4 left-4 text-[11px] font-medium text-cream/90 bg-black/60 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/10">
                      {sp.conservation_status}
                    </span>
                  )}
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between bg-paper">
                  <div>
                    <h3 className="font-display text-2xl font-bold text-forest group-hover:text-earth transition-colors leading-tight">
                      {sp.common_name}
                    </h3>
                    {sp.scientific_name && (
                      <p className="text-forest/60 italic font-editorial text-sm mt-1">
                        {sp.scientific_name}
                      </p>
                    )}
                  </div>
                  <div className="pt-4 mt-4 border-t border-forest/10 flex items-center justify-between text-xs text-forest/50 font-medium">
                    <span>Inspect Specimen</span>
                    <ChevronRight className="w-4 h-4 text-earth group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Interactive 3D Specimen Technology Showcase */}
      <section className="relative bg-[#06140b] py-20 px-4 overflow-hidden text-cream border-y border-emerald-500/20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <img
            src="/images/hero-forest.jpg"
            alt=""
            className="w-full h-full object-cover filter blur-[4px]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#06140b] via-[#06140b]/90 to-[#06140b]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs uppercase tracking-widest font-semibold mb-3">
              <Box className="w-3.5 h-3.5 text-emerald-400" />
              <span>Three.js 3D Specimen & Parallax Showcase</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Interactive Biodiversity Specimen Viewer
            </h2>
            <p className="text-emerald-200/75 text-sm sm:text-base mt-3 max-w-2xl mx-auto">
              Inspect biological specimens through ultra high-definition depth parallax photography and interactive Three.js 3D polygonal geometry with 360° rotation and zoom.
            </p>
          </div>

          {/* Master Interactive 3D Card with Amber Dragonfly Reference Specimen */}
          <InteractiveSpeciesCard extraSpecies={allSpecies.length > 0 ? allSpecies : featured} />
        </div>
      </section>

      {/* About Snippet */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sage/15 border border-sage/30 text-sage text-xs uppercase tracking-widest font-semibold mb-3">
              <Leaf className="w-3.5 h-3.5" /> Natural Heritage
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-forest tracking-tight leading-tight mb-6">
              Celebrating Living Nature Through Research
            </h2>
            <p className="font-editorial text-forest/80 text-lg leading-relaxed mb-4">
              BIODIVERSITY is dedicated to documenting and celebrating the extraordinary diversity of life on Earth. Through photography, 3D morphological specimens, and taxonomy records, we bring the natural world closer to scientists, students, and enthusiasts.
            </p>
            <p className="text-forest/70 leading-relaxed mb-8 text-sm sm:text-base">
              Our interactive digital magazine combines cutting-edge web 3D technologies with conservation science to build an inspiring archive for future generations.
            </p>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 bg-forest hover:bg-forest-light text-cream px-7 py-3.5 rounded-full font-medium transition-all shadow-md group"
            >
              <span>Learn More About Our Mission</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="flex justify-center">
            <div className="relative w-72 sm:w-96 aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-earth/20 bg-forest-dark group">
              <img
                src="/images/hero-specimen.jpg"
                alt="Biodiversity Specimen"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-cream">
                <span className="text-sage text-xs uppercase tracking-widest font-mono font-semibold">
                  Field Specimen
                </span>
                <p className="font-display text-xl font-bold mt-1">Preserving Ecological Memory</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Developers & Contributors Section */}
      <section className="bg-forest-dark py-24 px-4 relative overflow-hidden border-t border-cream/10">
        {/* Atmospheric ambient lighting & subtle botanical background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 50% 20%, rgba(117,139,112,0.45) 0%, transparent 75%)',
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10 space-y-16">
          {/* Main Section Header */}
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sage/15 border border-sage/30 text-sage text-xs uppercase tracking-widest font-semibold mb-3 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> Student Collaborators & Credits
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-cream tracking-tight mb-4">
              Meet the Developers
            </h2>
            <p className="font-editorial italic text-cream/80 text-base sm:text-lg leading-relaxed">
              A collaborative effort by BSIT and BTLED students to build this Biodiversity Web Portal.
            </p>
          </div>

          {/* Group A: BSIT – System Development Team */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-cream/10 pb-4 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Code2 className="w-5 h-5" />
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-cream">
                    BSIT – System Development Team
                  </h3>
                </div>
                <p className="text-cream/70 text-xs sm:text-sm font-editorial italic mt-1.5">
                  Students responsible for designing and developing the Biodiversity Web Portal.
                </p>
              </div>
              <span className="text-[11px] font-mono text-sage uppercase tracking-wider">
                {bsitContributors.length} Member{bsitContributors.length !== 1 ? 's' : ''}
              </span>
            </div>

            {bsitContributors.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-3xl bg-white/[0.02] border border-dashed border-cream/10">
                <Code2 className="w-10 h-10 text-sage/30 mx-auto mb-2" />
                <p className="text-cream/70 text-sm font-medium">No BSIT contributors added yet.</p>
                <p className="text-cream/40 text-xs mt-1 font-editorial italic">
                  Administrators can register developers in the admin portal under "Manage Contributors".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {bsitContributors.map((student) => (
                  <div
                    key={student.id}
                    className="group relative flex flex-col items-center text-center rounded-3xl bg-white/[0.04] border border-cream/10 hover:border-emerald-500/50 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl backdrop-blur-xs"
                  >
                    {/* Circular Student Profile Picture */}
                    <div className="relative w-24 h-24 rounded-full overflow-hidden bg-forest border-3 border-emerald-400/30 group-hover:border-emerald-400 mb-4 shadow-md transition-colors shrink-0">
                      {student.profile_image ? (
                        <img
                          src={getImageUrl(student.profile_image)}
                          alt={student.full_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-forest to-forest-dark text-cream font-display font-bold text-2xl">
                          {student.full_name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Full Name */}
                    <h4 className="font-display font-bold text-lg text-cream tracking-wide">
                      {student.full_name}
                    </h4>

                    {/* Course Badge */}
                    <span className="inline-block text-[10px] font-bold font-mono uppercase tracking-wider text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-3 py-0.5 rounded-full my-2 shadow-xs">
                      {student.course}
                    </span>

                    {/* Assigned Role */}
                    <p className="text-xs font-semibold text-sage uppercase tracking-wider">
                      {student.role}
                    </p>

                    {/* Short Description of Contribution */}
                    {student.contribution_description && (
                      <p className="font-editorial text-cream/70 text-xs sm:text-sm mt-3 line-clamp-3 leading-relaxed italic border-t border-cream/10 pt-3 w-full">
                        "{student.contribution_description}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Group B: BTLED – Educational Content Team */}
          <div className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-cream/10 pb-4 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <BookOpen className="w-5 h-5" />
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-cream">
                    BTLED – Educational Content Team
                  </h3>
                </div>
                <p className="text-cream/70 text-xs sm:text-sm font-editorial italic mt-1.5">
                  Students responsible for preparing biodiversity descriptions, educational information, and learning materials.
                </p>
              </div>
              <span className="text-[11px] font-mono text-earth-light uppercase tracking-wider">
                {btledContributors.length} Member{btledContributors.length !== 1 ? 's' : ''}
              </span>
            </div>

            {btledContributors.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-3xl bg-white/[0.02] border border-dashed border-cream/10">
                <BookOpen className="w-10 h-10 text-earth/40 mx-auto mb-2" />
                <p className="text-cream/70 text-sm font-medium">No BTLED contributors added yet.</p>
                <p className="text-cream/40 text-xs mt-1 font-editorial italic">
                  Administrators can register content developers in the admin portal under "Manage Contributors".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {btledContributors.map((student) => (
                  <div
                    key={student.id}
                    className="group relative flex flex-col items-center text-center rounded-3xl bg-white/[0.04] border border-cream/10 hover:border-earth/60 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl backdrop-blur-xs"
                  >
                    {/* Circular Student Profile Picture */}
                    <div className="relative w-24 h-24 rounded-full overflow-hidden bg-forest border-3 border-amber-400/30 group-hover:border-amber-400 mb-4 shadow-md transition-colors shrink-0">
                      {student.profile_image ? (
                        <img
                          src={getImageUrl(student.profile_image)}
                          alt={student.full_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-forest to-forest-dark text-cream font-display font-bold text-2xl">
                          {student.full_name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Full Name */}
                    <h4 className="font-display font-bold text-lg text-cream tracking-wide">
                      {student.full_name}
                    </h4>

                    {/* Course Badge */}
                    <span className="inline-block text-[10px] font-bold font-mono uppercase tracking-wider text-amber-300 bg-amber-950/80 border border-amber-500/30 px-3 py-0.5 rounded-full my-2 shadow-xs">
                      {student.course}
                    </span>

                    {/* Assigned Role */}
                    <p className="text-xs font-semibold text-earth-light uppercase tracking-wider">
                      {student.role}
                    </p>

                    {/* Short Description of Contribution */}
                    {student.contribution_description && (
                      <p className="font-editorial text-cream/70 text-xs sm:text-sm mt-3 line-clamp-3 leading-relaxed italic border-t border-cream/10 pt-3 w-full">
                        "{student.contribution_description}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-forest-dark text-cream/60 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-sage" />
            <span className="font-display font-bold text-cream">BIODIVERSITY</span>
          </div>
          <nav className="flex gap-6 text-sm">
            <Link to="/" className="hover:text-cream transition-colors">Home</Link>
            <Link to="/explore" className="hover:text-cream transition-colors">Explore</Link>
            <Link to="/locations" className="hover:text-cream transition-colors">Locations</Link>
            <Link to="/about" className="hover:text-cream transition-colors">About</Link>
          </nav>
          <p className="text-sm">&copy; {new Date().getFullYear()} BIODIVERSITY. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
