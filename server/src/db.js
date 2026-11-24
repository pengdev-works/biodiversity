/**
 * src/db.js
 * Pure Neon PostgreSQL database connection layer.
 * SQLite has been completely removed per requirements.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;

const LOCAL_DEFAULT_URL = 'postgresql://postgres:paragas2001@localhost:5432/bio';

const connectionString = process.env.DATABASE_URL || LOCAL_DEFAULT_URL;
const isLocalhost = Boolean(connectionString && (connectionString.includes('localhost') || connectionString.includes('127.0.0.1')));

const pgPool = new Pool({
  connectionString,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pgPool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]', err);
});

console.log(`✓ Initialized PostgreSQL Pool (${isLocalhost ? 'Localhost / pgAdmin 4' : 'Cloud / Neon'})`);
console.log(`✓ Database Target: ${connectionString.split('@')[1] || 'localhost'}`);

const pgSchema = `
CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin',
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  description TEXT,
  color       TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS species (
  id                  SERIAL PRIMARY KEY,
  common_name         TEXT NOT NULL,
  scientific_name     TEXT NOT NULL,
  category_id         INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  description         TEXT,
  habitat             TEXT,
  conservation_status TEXT CHECK (conservation_status IN (
    'Least Concern','Near Threatened','Vulnerable',
    'Endangered','Critically Endangered','Data Deficient','Not Evaluated'
  )),
  location            TEXT,
  is_published        BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  cover_photo_url     TEXT,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS species_photos (
  id          SERIAL PRIMARY KEY,
  species_id  INTEGER NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  caption     TEXT,
  is_cover    BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS species_3d_models (
  id          SERIAL PRIMARY KEY,
  species_id  INTEGER NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  format      TEXT NOT NULL DEFAULT 'glb',
  filename    TEXT,
  file_size   INTEGER,
  status      TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('uploaded','approved','failed')),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS magazine_publications (
  id              SERIAL PRIMARY KEY,
  title           TEXT NOT NULL,
  subtitle        TEXT,
  edition         TEXT,
  volume          TEXT,
  cover_photo_url TEXT,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  intro_title     TEXT,
  intro_body      TEXT,
  settings_json   JSONB,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS magazine_pages (
  id              SERIAL PRIMARY KEY,
  publication_id  INTEGER NOT NULL REFERENCES magazine_publications(id) ON DELETE CASCADE,
  page_number     INTEGER,
  template_type   TEXT,
  sort_order      INTEGER,
  content_json    JSONB,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contributors (
  id                        SERIAL PRIMARY KEY,
  full_name                 TEXT NOT NULL,
  profile_image             TEXT,
  course                    TEXT NOT NULL CHECK (course IN ('BSIT', 'BTLED')),
  role                      TEXT NOT NULL,
  contribution_description  TEXT,
  sort_order                INTEGER NOT NULL DEFAULT 0,
  created_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

const pgSeed = `
INSERT INTO categories (id, name, description, color, sort_order) VALUES
(1, 'Plant', 'Botanical flora, vascular trees, shrubs, and flowering species', '#10b981', 1),
(2, 'Insect', 'Hexapoda, arthropods, butterflies, and invertebrates', '#f59e0b', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO contributors (id, full_name, profile_image, course, role, contribution_description, sort_order) VALUES
(1, 'Wawawiwaaa', NULL, 'BSIT', 'Lead Developer', 'System development and technical architecture', 1),
(2, 'Jayvee S. Sagubay', NULL, 'BSIT', 'Developer', 'Frontend user interface design', 2),
(6, 'Frances C. Macapagal', NULL, 'BTLED', 'Researcher', 'Field documentation and species classification', 3),
(7, 'Eren Anne B. Ayup', NULL, 'BTLED', 'Content Specialist', 'Botanical research and educational curation', 4),
(8, 'Korina Domaoal', NULL, 'BTLED', 'Researcher', 'Taxonomic verification and habitat data', 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO species (id, common_name, scientific_name, category_id, description, habitat, conservation_status, location, is_published, is_featured, cover_photo_url) VALUES
(1, 'Amber Dragonfly', 'Pending Verification (Odonata sp.)', 2, 'A striking amber-brown dragonfly specimen documented resting on lush botanical foliage in Abra. Characterized by intricate venation across its dual translucent wings, large compound eyes for omnidirectional predatory vision, and a slender segmented abdomen.', 'Freshwater stream margins, wetland edges, and dense forest foliage.', 'Data Deficient', 'Abra Province, Northern Luzon', TRUE, TRUE, '/images/amber-dragonfly.jpg'),
(2, 'Asian Weaver Ant', 'Oecophylla smaragdina', 2, 'Arboreal social insects renowned for cooperative nest building using larval silk to sew living leaves together.', 'Forest canopies, citrus groves, and secondary tropical forests.', 'Least Concern', 'Lagangilang, Abra, Philippines', TRUE, FALSE, 'https://images.unsplash.com/photo-1602491453631-e2a5ad90a131?auto=format&fit=crop&w=1200&q=80'),
(3, 'Crab Spider / Flower Crab Spider', 'Thomisus sp. (Family Thomisidae)', 2, 'Ambush predator that conceals itself on blossoms and foliage to capture visiting pollinator insects.', 'Flowering shrubs, forest margins, and garden flowers.', 'Least Concern', 'Lagangilang, Abra, Philippines', TRUE, FALSE, 'https://images.unsplash.com/photo-1579613832125-5d34a13ffe0a?auto=format&fit=crop&w=1200&q=80'),
(4, 'Pear-shaped Leucauge', 'Leucauge fastigata', 2, 'Horizontal orb-weaving spider characterized by an elongated silver-and-emerald patterned abdomen.', 'Riparian forests and damp understory foliage.', 'Least Concern', 'Abra Province, Philippines', TRUE, FALSE, NULL),
(5, 'Orange Tortoise Beetle', 'Laccoptera tredecimpunctata', 2, 'Distinctive dome-shaped leaf beetle with 13 black punctate spots across a bright golden-orange carapace.', 'Sweet potato vines and convolvulaceous morning glory foliage.', 'Least Concern', 'Abra Province, Philippines', TRUE, FALSE, NULL),
(6, 'Crape Jasmine / Pandakaki', 'Tabernaemontana divaricata', 1, 'Glossy green shrub with pinwheel-shaped white blossoms containing fragrant milky medicinal sap.', 'Lowland forests and cultivated garden perimeters.', 'Least Concern', 'Abra Province, Philippines', TRUE, FALSE, NULL),
(7, 'White Leadtree / Ipil-ipil', 'Leucaena leucocephala', 1, 'Fast-growing leguminous nitrogen-fixing tree providing animal fodder, green manure, and slope stabilization.', 'Open grasslands, hillsides, and riverbanks.', 'Least Concern', 'Abra, Philippines', TRUE, FALSE, NULL),
(8, 'Sensitive Plant / Makahiya', 'Mimosa pudica L.', 1, 'Creeping botanical herb famous for thigmonastic leaf movement where leaflets rapidly fold inward upon touch.', 'Pastures, roadsides, and tropical open biomes.', 'Least Concern', 'Abra Province, Philippines', TRUE, FALSE, NULL),
(9, 'Pantropical Huntsman Spider', 'Heteropoda venatoria', 2, 'Large nocturnal wandering spider that hunts cockroaches and insect pests without constructing webs.', 'Tree bark crevices, foliage, and rural building perimeters.', 'Least Concern', 'Abra, Philippines', TRUE, FALSE, NULL),
(10, 'Bark Cricket / Dark Brown Cricket', 'Landrevinae sp.', 2, 'Subterranean and leaf-litter dwelling cricket known for resonant territorial acoustic chirping.', 'Forest floor decaying logs, leaf litter, and root hollows.', 'Least Concern', 'Abra, Philippines', TRUE, FALSE, NULL),
(11, 'Snake Plant', 'Dracaena trifasciata', 1, 'Hardy evergreen perennial with stiff upright sword-shaped succulent foliage banded in grey-green and yellow.', 'Rocky terrain, dry forests, and home gardens.', 'Least Concern', 'Abra, Philippines', TRUE, FALSE, NULL),
(12, 'Blow Fly / Bottle Fly', 'Calliphoridae (Family)', 2, 'Metallic green or bronze scavengers serving as primary ecological decomposers in terrestrial biomes.', 'Varied open and canopy biomes.', 'Least Concern', 'Abra, Philippines', TRUE, FALSE, NULL),
(13, 'Croton / San Francisco', 'Codiaeum variegatum', 1, 'Vibrant tropical shrub adorned with multi-colored thick leathery leaves ranging from scarlet to amber and emerald.', 'Tropical secondary forests and landscaped spaces.', 'Least Concern', 'Abra, Philippines', TRUE, FALSE, NULL),
(14, 'Papaya / Pawpaw', 'Carica papaya', 1, 'Fast-growing tropical arborescent plant yielding nutrient-dense fruits and proteolytic papain enzymes.', 'Fertile tropical river plains and farmsteads.', 'Least Concern', 'Abra, Philippines', TRUE, FALSE, NULL),
(15, 'Variegated Gandarusa', 'Justicia gendarussa', 1, 'Erect branched subshrub with variegated lanceolate leaves used in regional ethnobotanical remedies.', 'Riverbanks, damp thickets, and villages.', 'Least Concern', 'Abra, Philippines', TRUE, FALSE, NULL),
(16, 'Mango', 'Mangifera indica L.', 1, 'Majestic tropical fruit tree with deep taproots and dense spreading canopies producing sweet national mangoes.', 'Tropical lowland plains and orchard valleys.', 'Least Concern', 'Abra Province, Philippines', TRUE, FALSE, NULL),
(17, 'Camphor Shrub / Sambong', 'Blumea balsamifera', 1, 'Aromatic medicinal shrub celebrated for essential volatile camphor oils and kidney health applications.', 'Open grasslands, mountain slopes, and stream banks.', 'Least Concern', 'Abra, Philippines', TRUE, FALSE, NULL),
(18, 'Rice Grasshopper', 'Oxya chinensis', 2, 'Herbivorous insect adapted with powerful saltatorial hind legs and camouflage green coloration.', 'Agricultural wetland paddy fields and grassy swales.', 'Least Concern', 'Abra, Philippines', TRUE, FALSE, NULL),
(19, 'Okra / Lady Finger', 'Abelmoschus esculentus', 1, 'Annual mallow-family crop producing elongated ribbed seed pods rich in dietary fiber.', 'Cultivated valley plots and gardens.', 'Least Concern', 'Abra, Philippines', TRUE, FALSE, NULL),
(20, 'Pineapple / Piña', 'Ananas comosus', 1, 'Bromeliad with rosette whorls of spiny leaves bearing succulent composite fruits.', 'Well-drained sloping agricultural terrain.', 'Least Concern', 'Abra, Philippines', TRUE, FALSE, NULL),
(21, 'Caladium / Gabi-gabihan', 'Caladium bicolor', 1, 'Ornamental arum plant displaying translucent heart-shaped foliage splashed with pink and ivory patterns.', 'Understory forest floors and stream banks.', 'Least Concern', 'Abra, Philippines', TRUE, FALSE, NULL),
(22, 'Butterfly Pea', 'Clitoria ternatea L.', 1, 'Perennial herbaceous vine bearing deep cobalt-blue edible flowers rich in anthocyanin antioxidants.', 'Forest margins, hedgerows, and roadsides.', 'Least Concern', 'Abra, Philippines', TRUE, FALSE, NULL),
(30, 'Pied Paddy Skimmer Dragonfly', 'Neurothemis fluctuans', 2, 'Red-and-amber winged dragonfly frequently seen patrolling freshwater marshes and ditch edges.', 'Wetland canals, ponds, and slow-moving streams.', 'Least Concern', 'Abra River Basins', TRUE, FALSE, '/models/dragonfly_3d_model.glb'),
(31, 'Spotted Orb-Weaver', 'Neoscona punctigera', 2, 'Nocturnal spider constructing large geometric orb webs at dusk to catch night-flying insects.', 'Shrub layers, under eaves, and tree branches.', 'Least Concern', 'Abra, Philippines', TRUE, FALSE, NULL),
(35, 'Flat-Backed Millipede', 'Orthomorpha sp.', 2, 'Segmented detritivore with contrasting yellow-and-black paranota that breaks down leaf litter into fertile humus.', 'Moist leaf litter, decomposing timber, and forest humus.', 'Least Concern', 'Abra, Philippines', TRUE, FALSE, NULL),
(46, 'Rusty Millipede', 'Trigoniulus corallinus', 2, 'Cylindrical reddish-brown millipede inhabiting humid garden soil and rainforest floors.', 'Tropical compost, decaying logs, and mulch layers.', 'Least Concern', 'Abra, Philippines', TRUE, FALSE, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO species_3d_models (species_id, url, format, filename, file_size, status) VALUES
(1, '/models/dragonfly_3d_model.glb', 'glb', 'dragonfly_3d_model.glb', 723328, 'approved')
ON CONFLICT DO NOTHING;

SELECT setval('admin_users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM admin_users));
SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM categories));
SELECT setval('species_id_seq', (SELECT COALESCE(MAX(id), 1) FROM species));
SELECT setval('species_photos_id_seq', (SELECT COALESCE(MAX(id), 1) FROM species_photos));
SELECT setval('species_3d_models_id_seq', (SELECT COALESCE(MAX(id), 1) FROM species_3d_models));
SELECT setval('contributors_id_seq', (SELECT COALESCE(MAX(id), 1) FROM contributors));
`;

export async function query(sql, params = []) {
  try {
    const result = await pgPool.query(sql, params);
    return result;
  } catch (err) {
    console.error('[Database Query Error]:', err.message);
    if (err.message && err.message.includes('quota')) {
      return { rows: [], rowCount: 0, quotaExceeded: true };
    }
    throw err;
  }
}

export async function initializeDatabase() {
  try {
    await pgPool.query(pgSchema);
    console.log('✓ PostgreSQL database connected & tables verified');

    // Ensure default admin user with valid admin123 password exists
    const adminHash = '$2a$10$HmWwgLq3dJ.F92ZvYYSSf.fyNg.iI0Eld3Vj21d73RjraCA4yuDi2';
    await pgPool.query(`
      INSERT INTO admin_users (username, email, password_hash, role)
      VALUES ('admin', 'admin@example.com', $1, 'admin')
      ON CONFLICT (username) DO UPDATE SET password_hash = $1;
    `, [adminHash]);
    console.log('✓ Admin user verified (username: admin)');

    // Auto-seed default taxonomy, contributors, and curated species if database is empty
    const checkCount = await pgPool.query('SELECT COUNT(*) FROM species;');
    if (parseInt(checkCount.rows[0].count, 10) === 0) {
      console.log('⚡ Empty database detected. Auto-seeding initial Abra biodiversity dataset...');
      await pgPool.query(pgSeed);
      console.log('✓ Successfully auto-seeded 26 species records, categories, and contributors!');
    }
  } catch (err) {
    console.warn('⚠️ [PostgreSQL Warning] Could not verify schema on startup:', err.message);
  }
}
