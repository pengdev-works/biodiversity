import { Leaf, Shield, BookOpen, Compass, Award, HeartHandshake } from 'lucide-react';

export default function AboutPage() {
  const iucnCategories = [
    { code: 'LC', name: 'Least Concern', desc: 'Lowest risk; does not qualify for a higher risk category. Widespread and abundant taxa are included in this category.', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    { code: 'NT', name: 'Near Threatened', desc: 'Close to qualifying for or likely to qualify for a threatened category in the near future.', color: 'bg-lime-100 text-lime-800 border-lime-300' },
    { code: 'VU', name: 'Vulnerable', desc: 'Considered to be facing a high risk of extinction in the wild.', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    { code: 'EN', name: 'Endangered', desc: 'Facing a very high risk of extinction in the wild in the near future.', color: 'bg-orange-100 text-orange-800 border-orange-300' },
    { code: 'CR', name: 'Critically Endangered', desc: 'Facing an extremely high risk of extinction in the wild.', color: 'bg-rose-100 text-rose-800 border-rose-300' },
    { code: 'DD', name: 'Data Deficient', desc: 'Inadequate information to make a direct, or indirect, assessment of its risk of extinction.', color: 'bg-stone-100 text-stone-700 border-stone-300' },
  ];

  return (
    <div className="min-h-screen bg-paper pb-24">
      {/* Hero with Atmospheric Nature Backdrop */}
      <section className="relative bg-forest-dark text-cream pt-24 pb-20 px-4 overflow-hidden border-b border-cream/10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src="/images/hero-forest.jpg"
            alt=""
            className="w-full h-full object-cover filter brightness-[0.45] contrast-[1.1] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-forest-dark/90 via-forest/75 to-forest-dark" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(ellipse at 50% 30%, rgba(20,40,30,0.3) 0%, rgba(10,22,16,0.9) 100%)',
            }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-cream/20 text-sage text-xs uppercase tracking-widest font-semibold mb-4 shadow-lg mx-auto">
            <Leaf className="w-3.5 h-3.5 text-sage" /> Editorial Mission
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight mb-6 drop-shadow-md">
            About BIODIVERSITY
          </h1>
          <p className="font-editorial italic text-cream/90 text-xl leading-relaxed max-w-2xl mx-auto">
            Bridging field biology, high-resolution photography, and interactive 3D technology to create a living digital coffee table book.
          </p>
        </div>
      </section>

      {/* Main Narrative */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16">
        <div className="bg-white rounded-3xl p-6 sm:p-12 shadow-sm border border-forest/10 space-y-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-forest mb-4">
              The Digital Biodiversity Science Portal
            </h2>
            <p className="font-editorial text-forest/80 text-base sm:text-lg leading-relaxed drop-cap">
              BIODIVERSITY is an interactive digital science portal dedicated to documenting and preserving regional flora, fauna, and fungi. Combining field observation photography, taxonomic data, habitat mapping, and interactive 3D specimens, this web platform brings biological sciences to life for researchers, educators, students, and conservationists.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-forest/10">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-sage/20 text-forest flex items-center justify-center">
                <Leaf className="w-5 h-5 text-forest" />
              </div>
              <h3 className="font-display font-bold text-forest">Digital Field Dossiers</h3>
              <p className="text-xs text-forest/60 leading-relaxed">
                Comprehensive species cataloging with high-definition photography, taxonomy structures, and verified field observation records.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-earth/20 text-forest flex items-center justify-center">
                <Compass className="w-5 h-5 text-earth" />
              </div>
              <h3 className="font-display font-bold text-forest">Interactive 3D</h3>
              <p className="text-xs text-forest/60 leading-relaxed">
                GLB/GLTF rendered models let visitors study anatomical details and biodiversity morphology.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-forest/20 text-forest flex items-center justify-center">
                <Shield className="w-5 h-5 text-forest" />
              </div>
              <h3 className="font-display font-bold text-forest">Conservation Aware</h3>
              <p className="text-xs text-forest/60 leading-relaxed">
                Classified according to IUCN Red List guidelines to raise awareness for endangered regional species.
              </p>
            </div>
          </div>
        </div>

        {/* IUCN Conservation Guide */}
        <div className="mt-16 bg-cream rounded-3xl p-8 sm:p-12 border border-forest/10">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-earth" />
            <span className="text-xs font-semibold uppercase tracking-widest text-earth">Reference Standard</span>
          </div>
          <h2 className="font-display text-3xl font-bold text-forest mb-2">
            IUCN Red List Categories
          </h2>
          <p className="font-editorial italic text-forest/70 text-sm mb-8">
            The International Union for Conservation of Nature (IUCN) Red List is the world's most comprehensive inventory of the global conservation status of biological species.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {iucnCategories.map(cat => (
              <div key={cat.code} className="bg-white rounded-2xl p-5 border border-forest/5 flex items-start gap-4">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 border ${cat.color}`}>
                  {cat.code}
                </span>
                <div>
                  <h4 className="font-display font-bold text-forest text-sm">{cat.name}</h4>
                  <p className="text-xs text-forest/60 mt-1 leading-relaxed">{cat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conservation Commitment */}
        <div className="mt-16 text-center space-y-4">
          <div className="w-12 h-12 bg-forest text-sage rounded-full flex items-center justify-center mx-auto">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="font-display text-2xl font-bold text-forest">Field Data Integrity</h3>
          <p className="font-editorial italic text-forest/70 text-sm max-w-xl mx-auto">
            All photography, 3D assets, and scientific notes in this publication are documented and authorized by field research administrators to ensure accuracy and respect for natural habitats.
          </p>
        </div>
      </section>
    </div>
  );
}

