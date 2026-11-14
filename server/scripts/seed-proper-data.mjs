/**
 * server/scripts/seed-proper-data.mjs
 * Seeds authentic, rich scientific biodiversity records into SQLite.
 */

import { initializeDatabase, query } from '../src/db.js';

async function seed() {
  await initializeDatabase();
  console.log('Seeding scientific biodiversity catalog...');

  // 1. Clear test/gibberish data
  await query('DELETE FROM magazine_pages');
  await query('DELETE FROM species_3d_models');
  await query('DELETE FROM species_photos');
  await query('DELETE FROM species');
  await query('DELETE FROM categories');

  // 2. Insert authentic Categories
  const categoriesData = [
    {
      name: 'Lepidoptera & Insects',
      description: 'Butterflies, moths, beetles, pollinators, and forest floor invertebrates.',
      color: '#4A7C59',
      sort_order: 1
    },
    {
      name: 'Avian Species & Birds',
      description: 'Canopy raptors, forest songbirds, migratory waders, and endemic island avians.',
      color: '#B68C62',
      sort_order: 2
    },
    {
      name: 'Flora & Botanicals',
      description: 'Ancient dipterocarps, epiphytic orchids, parasitic blooms, and medicinal flora.',
      color: '#2D6A4F',
      sort_order: 3
    },
    {
      name: 'Herpetofauna & Reptiles',
      description: 'Forest monitor lizards, endemic pit vipers, skinks, and riparian amphibians.',
      color: '#8D6B47',
      sort_order: 4
    },
    {
      name: 'Mammalia & Forest Wildlife',
      description: 'Canopy fruit bats, civets, wild ungulates, and arboreal forest mammals.',
      color: '#758B70',
      sort_order: 5
    },
    {
      name: 'Fungi & Mycological Flora',
      description: 'Decomposers, bioluminescent forest mushrooms, and polypore bracket fungi.',
      color: '#A07855',
      sort_order: 6
    }
  ];

  const catMap = {};
  for (const c of categoriesData) {
    const res = await query(`
      INSERT INTO categories (name, description, color, sort_order)
      VALUES ($1, $2, $3, $4)
    `, [c.name, c.description, c.color, c.sort_order]);

    const row = (await query('SELECT id FROM categories WHERE name = $1', [c.name])).rows[0];
    catMap[c.name] = row.id;
  }
  console.log('✓ Categories inserted:', Object.keys(catMap).length);

  // 3. Insert authentic Species
  const speciesData = [
    {
      common_name: 'Monarch Butterfly',
      scientific_name: 'Danaus plexippus',
      category: 'Lepidoptera & Insects',
      description: 'Renowned for its extraordinary multi-generational migration across continents. Its distinctive orange and black wing patterns serve as warning coloration (aposematism) to predators of its cardenolide toxicity accumulated from milkweed plants.',
      habitat: 'Milkweed meadows, forest clearings, and temperate woodland canopies',
      conservation_status: 'Endangered',
      location: 'Sierra Madre Mountain Range, Luzon (14.8211° N, 121.3522° E)',
      cover_photo_url: '/uploads/butterfly-monarch.jpg',
      is_published: 1,
      is_featured: 1,
      sort_order: 1
    },
    {
      common_name: 'Philippine Eagle',
      scientific_name: 'Pithecophaga jefferyi',
      category: 'Avian Species & Birds',
      description: 'The Great Philippine Eagle is among the largest and most powerful forest raptors on Earth. Featuring a majestic shaggy brown crest and piercing bluish-grey eyes, it requires vast territories of undisturbed primary rainforest canopy to survive.',
      habitat: 'Primary lowland and montane tropical rainforest canopy',
      conservation_status: 'Critically Endangered',
      location: 'Mount Apo Natural Park, Mindanao (7.0056° N, 125.2711° E)',
      cover_photo_url: '/uploads/eagle.jpg',
      is_published: 1,
      is_featured: 1,
      sort_order: 2
    },
    {
      common_name: 'Jade Vine',
      scientific_name: 'Strongylodon macrobotrys',
      category: 'Flora & Botanicals',
      description: 'A woody liana endemic to the tropical rainforests of the Philippines, famed for its cascading claw-shaped blossoms of an ethereal turquoise-jade hue. Pollinated primarily by bats clinging upside down to drink its nectar.',
      habitat: 'Humid tropical montane river ravines and primary rainforest',
      conservation_status: 'Endangered',
      location: 'Mount Makiling Forest Reserve, Laguna (14.1333° N, 121.1967° E)',
      cover_photo_url: '/uploads/botanical-jade-vine.jpg',
      is_published: 1,
      is_featured: 1,
      sort_order: 3
    },
    {
      common_name: 'Seven-Spotted Ladybug',
      scientific_name: 'Coccinella septempunctata',
      category: 'Lepidoptera & Insects',
      description: 'A vital biological pest control predator within terrestrial and agro-ecological systems. Characterized by its scarlet red elytra marked with seven distinctive black spots and polished chitinous exoskeleton.',
      habitat: 'Subalpine grasslands, shrublands, agricultural borders, and forest edges',
      conservation_status: 'Least Concern',
      location: 'Cordillera Central Highlands, Benguet (16.4023° N, 120.5960° E)',
      cover_photo_url: '/uploads/ladybug.jpg',
      is_published: 1,
      is_featured: 1,
      sort_order: 4
    },
    {
      common_name: 'Giant Golden-Crowned Flying Fox',
      scientific_name: 'Acerodon jubatus',
      category: 'Mammalia & Forest Wildlife',
      description: 'One of the largest bat species in the world, possessing a wingspan reaching up to 1.7 meters (5.6 feet). It plays an indispensable ecological role as a keystone seed disperser and pollinator across primary old-growth rainforests.',
      habitat: 'Undisturbed mature forest roosts on steep riverine slopes',
      conservation_status: 'Endangered',
      location: 'Subic Bay Protected Forest, Zambales (14.8250° N, 120.3167° E)',
      cover_photo_url: '/uploads/forest-fauna.jpg',
      is_published: 1,
      is_featured: 1,
      sort_order: 5
    },
    {
      common_name: 'Tropical Highland Orchid',
      scientific_name: 'Dendrobium papilio',
      category: 'Flora & Botanicals',
      description: 'An epiphytic orchid noted for delicate, butterfly-like translucent petals with subtle violet venation. Grows nestled among moss cushions on ancient dipterocarp branches within cloud forest mist zones.',
      habitat: 'Montane cloud forests and mossy oak ridges (1,200m–1,800m altitude)',
      conservation_status: 'Vulnerable',
      location: 'Mount Pulag National Park, Benguet (16.5978° N, 120.9000° E)',
      cover_photo_url: '/uploads/flora-orchid.jpg',
      is_published: 1,
      is_featured: 1,
      sort_order: 6
    }
  ];

  const now = new Date().toISOString();
  const speciesIdMap = {};

  for (const s of speciesData) {
    const catId = catMap[s.category];
    await query(`
      INSERT INTO species
        (common_name, scientific_name, category_id, description, habitat,
         conservation_status, location, cover_photo_url, is_published, is_featured, sort_order, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      s.common_name, s.scientific_name, catId, s.description, s.habitat,
      s.conservation_status, s.location, s.cover_photo_url, s.is_published, s.is_featured, s.sort_order, now, now
    ]);

    const created = (await query('SELECT id FROM species WHERE scientific_name = $1', [s.scientific_name])).rows[0];
    speciesIdMap[s.common_name] = created.id;

    // Insert primary photo into species_photos
    await query(`
      INSERT INTO species_photos (species_id, url, caption, is_cover, sort_order, created_at)
      VALUES ($1, $2, $3, 1, 1, $4)
    `, [created.id, s.cover_photo_url, `${s.common_name} Field Photography`, now]);
  }
  console.log('✓ Species inserted:', Object.keys(speciesIdMap).length);

  // 4. Attach 3D Model to Ladybug (Seven-Spotted Ladybug)
  const ladybugId = speciesIdMap['Seven-Spotted Ladybug'];
  if (ladybugId) {
    await query(`
      INSERT INTO species_3d_models
        (species_id, url, format, filename, status, created_at)
      VALUES ($1, '/uploads/1794389497987-686300609.glb', 'glb', 'Seven-Spotted Ladybug 3D Model', 'approved', $2)
    `, [ladybugId, now]);
    console.log('✓ 3D model attached to Seven-Spotted Ladybug');
  }

  // 5. Ensure Magazine Publication #2 exists with proper data
  const pubCheck = await query('SELECT id FROM magazine_publications WHERE id = 2');
  if (pubCheck.rows.length === 0) {
    await query(`
      INSERT INTO magazine_publications
        (id, title, subtitle, edition, volume, cover_photo_url, status, intro_title, intro_body, created_at, updated_at)
      VALUES (2, 'BIODIVERSITY', 'An Interactive Journey Through Living Nature', 'Vol. 1 — Inaugural Edition', 'Special Publication', '/uploads/magazine-cover-forest.jpg', 'published', 'Celebrating Earth’s Living Heritage', 'Welcome to this digital edition showcasing the rich biodiversity and unique ecosystems documented across natural habitats.', $1, $1)
    `, [now]);
  } else {
    await query(`
      UPDATE magazine_publications
      SET title = 'BIODIVERSITY',
          subtitle = 'An Interactive Journey Through Living Nature',
          edition = 'Vol. 1 — Inaugural Edition',
          volume = 'Special Publication',
          cover_photo_url = '/uploads/magazine-cover-forest.jpg',
          status = 'published',
          intro_title = 'Celebrating Earth’s Living Heritage',
          intro_body = 'Welcome to this digital edition showcasing the rich biodiversity and unique ecosystems documented across natural habitats.',
          updated_at = $1
      WHERE id = 2
    `, [now]);
  }

  // 6. Build a complete 8-page flipbook spread for Publication #2
  const speciesList = (await query(`
    SELECT s.*, c.name AS category_name, c.color AS category_color
    FROM species s
    LEFT JOIN categories c ON c.id = s.category_id
    WHERE s.is_published = 1
    ORDER BY s.sort_order ASC
    LIMIT 4
  `)).rows;

  const pages = [
    // Page 1: Cover
    {
      page_number: 1,
      template_type: 'cover',
      sort_order: 1,
      content_json: {
        title: 'BIODIVERSITY',
        subtitle: 'An Interactive Journey Through Living Nature',
        edition: 'Vol. 1 — Inaugural Edition',
        volume: 'Special Publication'
      }
    },
    // Page 2: Table of Contents
    {
      page_number: 2,
      template_type: 'toc',
      sort_order: 2,
      content_json: {
        entries: [
          { page: '03', title: 'Editorial: Celebrating Earth’s Living Heritage' },
          { page: '04', title: 'Monarch Butterfly (Danaus plexippus)' },
          { page: '06', title: 'Philippine Eagle (Pithecophaga jefferyi)' },
          { page: '08', title: 'Seven-Spotted Ladybug with 3D Specimen' },
          { page: '09', title: 'Field Research Photo Gallery' },
          { page: '10', title: 'Preservation Pledge & Back Cover' }
        ]
      }
    },
    // Page 3: Editorial Introduction
    {
      page_number: 3,
      template_type: 'intro',
      sort_order: 3,
      content_json: {
        title: 'Celebrating Earth’s Living Heritage',
        body: 'Welcome to the inaugural edition of BIODIVERSITY.\n\nFrom the ancient canopies of the Sierra Madre to the subalpine peaks of Mount Apo, Earth’s living tapestry is woven with astonishing complexity. Every species documented in this dossier represents millions of years of evolutionary mastery.\n\nThrough immersive digital publishing, interactive 3D morphology, and rigorous field naturalism, our mission is to illuminate these remarkable organisms and inspire urgent, collective stewardship of the habitats they call home.'
      }
    },
    // Page 4: Species Feature (Monarch Butterfly)
    {
      page_number: 4,
      template_type: 'species-feature',
      sort_order: 4,
      content_json: {
        species: speciesList.find(s => s.common_name === 'Monarch Butterfly') || speciesList[0]
      }
    },
    // Page 5: Species Detail (Monarch Butterfly)
    {
      page_number: 5,
      template_type: 'species-detail',
      sort_order: 5,
      content_json: {
        species: speciesList.find(s => s.common_name === 'Monarch Butterfly') || speciesList[0]
      }
    },
    // Page 6: Species Feature (Philippine Eagle)
    {
      page_number: 6,
      template_type: 'species-feature',
      sort_order: 6,
      content_json: {
        species: speciesList.find(s => s.common_name === 'Philippine Eagle') || speciesList[1]
      }
    },
    // Page 7: Species Detail (Philippine Eagle)
    {
      page_number: 7,
      template_type: 'species-detail',
      sort_order: 7,
      content_json: {
        species: speciesList.find(s => s.common_name === 'Philippine Eagle') || speciesList[1]
      }
    },
    // Page 8: Gallery
    {
      page_number: 8,
      template_type: 'gallery',
      sort_order: 8,
      content_json: {
        photos: [
          { url: '/uploads/butterfly-monarch.jpg', caption: 'Monarch Butterfly (Danaus plexippus)' },
          { url: '/uploads/eagle.jpg', caption: 'Great Philippine Eagle (Pithecophaga jefferyi)' },
          { url: '/uploads/botanical-jade-vine.jpg', caption: 'Cascading Jade Vine (Strongylodon macrobotrys)' },
          { url: '/uploads/ladybug.jpg', caption: 'Seven-Spotted Ladybug (Coccinella septempunctata)' }
        ]
      }
    },
    // Page 9: Back Cover
    {
      page_number: 9,
      template_type: 'back-cover',
      sort_order: 9,
      content_json: {
        closing: 'Preserving biodiversity for future generations. Active ecological monitoring, taxonomy archives, and habitat protection.',
        credits: 'BIODIVERSITY Editorial Team & Field Naturalists'
      }
    }
  ];

  for (const p of pages) {
    await query(`
      INSERT INTO magazine_pages (publication_id, page_number, template_type, sort_order, content_json)
      VALUES (2, $1, $2, $3, $4)
    `, [p.page_number, p.template_type, p.sort_order, JSON.stringify(p.content_json)]);
  }
  console.log(`✓ Magazine pages created: ${pages.length} pages`);

  console.log('✅ Scientific biodiversity catalog successfully seeded!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
