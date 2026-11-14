import path from 'path';
import sharp from 'sharp';

/**
 * 3D Geometry Utilities
 */
function pad4(buf) {
  const rem = buf.length % 4;
  return rem === 0 ? buf : Buffer.concat([buf, Buffer.alloc(4 - rem)]);
}

/**
 * Creates an iridescent botanical/fauna wing & specimen texture using sharp.
 */
async function generateCreatureTexture({
  commonName = 'Specimen',
  scientificName = '',
  categoryName = 'Fauna',
  conservationStatus = 'Documented',
  imageBuffer = null,
  style = 'butterfly'
}) {
  // If in relief mode and image is provided, use the uploaded image directly for 1:1 photorealistic surface mapping!
  if (style === 'relief' && imageBuffer && imageBuffer.length > 0) {
    try {
      return await sharp(imageBuffer)
        .resize(1024, 1024, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 92 })
        .toBuffer();
    } catch (err) {
      console.warn('[glbGenerator] Failed to resize uploaded relief image:', err.message);
    }
  }

  const size = 1024;
  const safeCommon = (commonName || 'Specimen').replace(/[<>&"]/g, '');
  const safeScientific = (scientificName || '').replace(/[<>&"]/g, '');
  const safeCategory = (categoryName || 'Natural Life').replace(/[<>&"]/g, '');

  let photoComposite = null;
  if (imageBuffer && imageBuffer.length > 0) {
    try {
      const resized = await sharp(imageBuffer)
        .resize(500, 500, { fit: 'cover', position: 'center' })
        .toBuffer();
      photoComposite = {
        input: resized,
        top: 60,
        left: 262
      };
    } catch {}
  }

  const svg = `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1A535C"/>
        <stop offset="35%" stop-color="#4ECDC4"/>
        <stop offset="70%" stop-color="#F7FFF7"/>
        <stop offset="100%" stop-color="#FF6B6B"/>
      </linearGradient>

      <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1B4332"/>
        <stop offset="50%" stop-color="#2D6A4F"/>
        <stop offset="100%" stop-color="#74C69D"/>
      </linearGradient>

      <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#8B4513"/>
        <stop offset="40%" stop-color="#D4AF37"/>
        <stop offset="80%" stop-color="#FFD700"/>
        <stop offset="100%" stop-color="#FFA500"/>
      </linearGradient>

      <linearGradient id="brassPlate" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#654321"/>
        <stop offset="30%" stop-color="#D4AF37"/>
        <stop offset="70%" stop-color="#AA7C11"/>
        <stop offset="100%" stop-color="#3A2800"/>
      </linearGradient>
    </defs>

    <!-- Rich Background Palette -->
    <rect width="${size}" height="${size}" fill="${style === 'botanical' ? 'url(#leafGrad)' : style === 'amber' ? 'url(#amberGrad)' : 'url(#wingGrad)'}"/>

    <!-- Organic Wing / Leaf Vein Overlay -->
    <g opacity="0.35" stroke="#FFFFFF" stroke-width="3" fill="none">
      <path d="M 512 100 Q 200 300 100 600" />
      <path d="M 512 100 Q 824 300 924 600" />
      <path d="M 512 250 Q 250 450 150 750" />
      <path d="M 512 250 Q 774 450 874 750" />
      <path d="M 512 400 Q 300 600 200 900" />
      <path d="M 512 400 Q 724 600 824 900" />
    </g>

    ${!photoComposite ? `
      <!-- Stylized Center Biological Medallion if no photo -->
      <g transform="translate(512, 360)">
        <circle r="190" fill="#0C1510" opacity="0.8" stroke="#D4AF37" stroke-width="4"/>
        <circle r="175" fill="none" stroke="#D4AF37" stroke-width="1.5" stroke-dasharray="8 6"/>
        <path d="M 0 -100 C 60 -50 80 30 0 100 C -80 30 -60 -50 0 -100 Z" fill="#4ECDC4" opacity="0.9"/>
        <line x1="0" y1="-100" x2="0" y2="100" stroke="#0C1510" stroke-width="4"/>
        <text y="140" text-anchor="middle" font-family="Georgia, serif" font-size="20" font-weight="bold" fill="#F8F5EE" letter-spacing="3">AUTHENTIC SPECIMEN</text>
      </g>
    ` : ''}

    <!-- Museum Brass Placard at Bottom -->
    <g transform="translate(112, 680)">
      <rect width="800" height="280" rx="14" fill="#0E1912" stroke="url(#brassPlate)" stroke-width="5"/>
      <rect x="14" y="14" width="772" height="252" rx="8" fill="none" stroke="#D4AF37" stroke-width="1" opacity="0.4"/>

      <!-- Corner Rivets -->
      <circle cx="28" cy="28" r="5" fill="#D4AF37"/>
      <circle cx="772" cy="28" r="5" fill="#D4AF37"/>
      <circle cx="28" cy="252" r="5" fill="#D4AF37"/>
      <circle cx="772" cy="252" r="5" fill="#D4AF37"/>

      <text x="400" y="55" text-anchor="middle" font-family="monospace" font-size="16" font-weight="bold" fill="#D4AF37" letter-spacing="4">
        ★ BIODIVERSITY 3D ARCHIVE ★
      </text>

      <text x="400" y="125" text-anchor="middle" font-family="Georgia, serif" font-size="44" font-weight="bold" fill="#F8F5EE" letter-spacing="1">
        ${safeCommon.toUpperCase()}
      </text>

      <text x="400" y="175" text-anchor="middle" font-family="Georgia, serif" font-size="26" font-style="italic" fill="#E2C485">
        ${safeScientific}
      </text>

      <line x1="160" y1="205" x2="640" y2="205" stroke="#D4AF37" stroke-width="1" opacity="0.4"/>

      <text x="180" y="240" text-anchor="start" font-family="monospace" font-size="15" fill="#4ECDC4" font-weight="bold">
        TAXON: ${safeCategory.toUpperCase()}
      </text>
      <text x="620" y="240" text-anchor="end" font-family="monospace" font-size="15" fill="#E28743" font-weight="bold">
        STATUS: ${(conservationStatus || 'Documented').toUpperCase()}
      </text>
    </g>
  </svg>
  `;

  const composites = [];
  if (photoComposite) composites.push(photoComposite);
  composites.push({ input: Buffer.from(svg), top: 0, left: 0 });

  return await sharp({
    create: { width: size, height: size, channels: 3, background: { r: 14, g: 25, b: 18 } }
  })
    .composite(composites)
    .jpeg({ quality: 90 })
    .toBuffer();
}

/**
 * STYLE 0: 🗿 3D Sculpted Depth Mesh (Image-to-3D Relief)
 * Uses the image pixels to calculate realistic heightfield depth, surface normals, and side thickness!
 */
async function buildImageReliefGeometry(imageBuffer) {
  const gridW = 64;
  const gridH = 64;
  let raw = null;

  if (imageBuffer && imageBuffer.length > 0) {
    try {
      raw = await sharp(imageBuffer)
        .resize(gridW + 1, gridH + 1, { fit: 'fill' })
        .raw()
        .toBuffer({ resolveWithObject: true });
    } catch (err) {
      console.warn('[glbGenerator] Relief raw parse error:', err.message);
    }
  }

  const ch = raw?.info?.channels || 3;
  const pos = [];
  const nor = [];
  const uvs = [];
  const ind = [];

  const w = 1.0;
  const h = 1.0;
  const depthScale = 0.42;
  const backZ = -0.12;

  // 1. Front Heightfield Vertices
  for (let y = 0; y <= gridH; y++) {
    for (let x = 0; x <= gridW; x++) {
      let lum = 0.5;
      if (raw && raw.data) {
        const idx = (y * (gridW + 1) + x) * ch;
        const r = raw.data[idx] || 0;
        const g = raw.data[idx + 1] || 0;
        const b = raw.data[idx + 2] || 0;
        lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0;
      }
      const px = (x / gridW - 0.5) * 2.0 * w;
      const py = (0.5 - y / gridH) * 2.0 * h;
      const pz = (lum - 0.5) * depthScale;

      pos.push(px, py, pz);
      nor.push(0, 0, 1);
      uvs.push(x / gridW, y / gridH);
    }
  }

  // Compute Surface Normals using Gradient Grids
  for (let y = 0; y <= gridH; y++) {
    for (let x = 0; x <= gridW; x++) {
      const xL = Math.max(0, x - 1), xR = Math.min(gridW, x + 1);
      const yU = Math.max(0, y - 1), yD = Math.min(gridH, y + 1);
      const zL = pos[(y * (gridW + 1) + xL) * 3 + 2];
      const zR = pos[(y * (gridW + 1) + xR) * 3 + 2];
      const zU = pos[(yU * (gridW + 1) + x) * 3 + 2];
      const zD = pos[(yD * (gridW + 1) + x) * 3 + 2];

      const dzdx = (zR - zL) / (xR - xL || 1);
      const dzdy = (zD - zU) / (yD - yU || 1);

      const nx = -dzdx * 4.5;
      const ny = dzdy * 4.5;
      const nz = 1.0;
      const len = Math.hypot(nx, ny, nz) || 1;
      const vIdx = (y * (gridW + 1) + x) * 3;
      nor[vIdx] = nx / len;
      nor[vIdx + 1] = ny / len;
      nor[vIdx + 2] = nz / len;
    }
  }

  // Front Triangles
  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      const a = y * (gridW + 1) + x;
      const b = a + 1;
      const c = (y + 1) * (gridW + 1) + x + 1;
      const d = (y + 1) * (gridW + 1) + x;
      ind.push(a, b, c, a, c, d);
    }
  }

  // 2. Solid Back Plane
  const backBase = pos.length / 3;
  pos.push(
    -w, -h, backZ,
     w, -h, backZ,
     w,  h, backZ,
    -w,  h, backZ
  );
  nor.push(
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1
  );
  uvs.push(0, 1, 1, 1, 1, 0, 0, 0);
  ind.push(backBase, backBase + 2, backBase + 1, backBase, backBase + 3, backBase + 2);

  // 3. Perimeter Side Walls Connecting Front to Back
  function addWallQuad(f1, f2, b1, b2, n) {
    const base = pos.length / 3;
    pos.push(...f1, ...f2, ...b2, ...b1);
    nor.push(...n, ...n, ...n, ...n);
    uvs.push(0.05, 0.95, 0.95, 0.95, 0.95, 0.98, 0.05, 0.98);
    ind.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  // Top Wall (y = 0)
  for (let x = 0; x < gridW; x++) {
    const i1 = x, i2 = x + 1;
    const f1 = [pos[i1 * 3], pos[i1 * 3 + 1], pos[i1 * 3 + 2]];
    const f2 = [pos[i2 * 3], pos[i2 * 3 + 1], pos[i2 * 3 + 2]];
    const b1 = [pos[i1 * 3], pos[i1 * 3 + 1], backZ];
    const b2 = [pos[i2 * 3], pos[i2 * 3 + 1], backZ];
    addWallQuad(f1, f2, b1, b2, [0, 1, 0]);
  }

  // Bottom Wall (y = gridH)
  for (let x = 0; x < gridW; x++) {
    const i1 = gridH * (gridW + 1) + x, i2 = i1 + 1;
    const f1 = [pos[i1 * 3], pos[i1 * 3 + 1], pos[i1 * 3 + 2]];
    const f2 = [pos[i2 * 3], pos[i2 * 3 + 1], pos[i2 * 3 + 2]];
    const b1 = [pos[i1 * 3], pos[i1 * 3 + 1], backZ];
    const b2 = [pos[i2 * 3], pos[i2 * 3 + 1], backZ];
    addWallQuad(f2, f1, b2, b1, [0, -1, 0]);
  }

  // Left Wall (x = 0)
  for (let y = 0; y < gridH; y++) {
    const i1 = y * (gridW + 1), i2 = (y + 1) * (gridW + 1);
    const f1 = [pos[i1 * 3], pos[i1 * 3 + 1], pos[i1 * 3 + 2]];
    const f2 = [pos[i2 * 3], pos[i2 * 3 + 1], pos[i2 * 3 + 2]];
    const b1 = [pos[i1 * 3], pos[i1 * 3 + 1], backZ];
    const b2 = [pos[i2 * 3], pos[i2 * 3 + 1], backZ];
    addWallQuad(f2, f1, b2, b1, [-1, 0, 0]);
  }

  // Right Wall (x = gridW)
  for (let y = 0; y < gridH; y++) {
    const i1 = y * (gridW + 1) + gridW, i2 = (y + 1) * (gridW + 1) + gridW;
    const f1 = [pos[i1 * 3], pos[i1 * 3 + 1], pos[i1 * 3 + 2]];
    const f2 = [pos[i2 * 3], pos[i2 * 3 + 1], pos[i2 * 3 + 2]];
    const b1 = [pos[i1 * 3], pos[i1 * 3 + 1], backZ];
    const b2 = [pos[i2 * 3], pos[i2 * 3 + 1], backZ];
    addWallQuad(f1, f2, b1, b2, [1, 0, 0]);
  }

  return {
    positions: new Float32Array(pos),
    normals: new Float32Array(nor),
    uvs: new Float32Array(uvs),
    indices: new Uint16Array(ind)
  };
}

/**
 * STYLE 1: 🦋 3D Butterfly / Winged Specimen
 * Constructs an authentic 3D organism with body, head, antennae, and angled dihedral wings!
 */
function buildButterflyGeometry() {
  const pos = [];
  const nor = [];
  const uvs = [];
  const ind = [];

  function addQuad(v1, v2, v3, v4, n, uvQuad) {
    const base = pos.length / 3;
    pos.push(...v1, ...v2, ...v3, ...v4);
    nor.push(...n, ...n, ...n, ...n);
    uvs.push(...uvQuad);
    ind.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  // 1. Thorax & Abdomen Body (3D Hexagonal Column along Y)
  const segments = 6;
  const bodyLen = 1.0;
  for (let s = 0; s < segments; s++) {
    const y0 = 0.5 - (s / segments) * bodyLen;
    const y1 = 0.5 - ((s + 1) / segments) * bodyLen;
    const r0 = s < 2 ? 0.08 : 0.07 * (1 - (s - 2) / (segments - 2) * 0.5);
    const r1 = s + 1 < 2 ? 0.08 : 0.07 * (1 - (s - 1) / (segments - 2) * 0.5);

    for (let i = 0; i < 6; i++) {
      const a0 = (i / 6) * Math.PI * 2;
      const a1 = ((i + 1) / 6) * Math.PI * 2;
      const x00 = Math.cos(a0) * r0, z00 = Math.sin(a0) * r0;
      const x01 = Math.cos(a1) * r0, z01 = Math.sin(a1) * r0;
      const x10 = Math.cos(a0) * r1, z10 = Math.sin(a0) * r1;
      const x11 = Math.cos(a1) * r1, z11 = Math.sin(a1) * r1;

      const n = [Math.cos((a0 + a1) / 2), 0, Math.sin((a0 + a1) / 2)];
      addQuad(
        [x00, y0, z00], [x01, y0, z01], [x11, y1, z11], [x10, y1, z10],
        n,
        [0.48, 0.48, 0.52, 0.48, 0.52, 0.52, 0.48, 0.52]
      );
    }
  }

  // 2. Head & Antennae
  addQuad(
    [-0.07, 0.5, 0.07], [0.07, 0.5, 0.07], [0.05, 0.65, 0.05], [-0.05, 0.65, 0.05],
    [0, 1, 1],
    [0.49, 0.49, 0.51, 0.49, 0.51, 0.51, 0.49, 0.51]
  );
  // Left Antenna
  addQuad(
    [-0.03, 0.65, 0.05], [-0.02, 0.65, 0.05], [-0.18, 0.95, 0.15], [-0.2, 0.94, 0.15],
    [0, 0, 1],
    [0.49, 0.49, 0.51, 0.49, 0.51, 0.51, 0.49, 0.51]
  );
  // Right Antenna
  addQuad(
    [0.02, 0.65, 0.05], [0.03, 0.65, 0.05], [0.2, 0.94, 0.15], [0.18, 0.95, 0.15],
    [0, 0, 1],
    [0.49, 0.49, 0.51, 0.49, 0.51, 0.51, 0.49, 0.51]
  );

  // 3. 3D Wings with upward Dihedral Angle (+22 degrees on Z)
  // Left Forewing
  addQuad(
    [0, 0.2, 0.05],
    [-1.4, 0.85, 0.38],
    [-1.0, 0.05, 0.28],
    [-0.15, 0.1, 0.06],
    [0.2, 0.2, 0.9],
    [0.5, 0.35, 0.02, 0.05, 0.08, 0.55, 0.45, 0.4]
  );

  // Right Forewing (Mirrored)
  addQuad(
    [0, 0.2, 0.05],
    [0.15, 0.1, 0.06],
    [1.0, 0.05, 0.28],
    [1.4, 0.85, 0.38],
    [-0.2, 0.2, 0.9],
    [0.5, 0.35, 0.55, 0.4, 0.92, 0.55, 0.98, 0.05]
  );

  // Left Hindwing
  addQuad(
    [-0.08, 0.08, 0.05],
    [-0.95, -0.05, 0.25],
    [-0.65, -0.7, 0.18],
    [-0.05, -0.3, 0.04],
    [0.1, -0.2, 0.9],
    [0.48, 0.4, 0.1, 0.55, 0.25, 0.95, 0.45, 0.75]
  );

  // Right Hindwing (Mirrored)
  addQuad(
    [0.08, 0.08, 0.05],
    [0.05, -0.3, 0.04],
    [0.65, -0.7, 0.18],
    [0.95, -0.05, 0.25],
    [-0.1, -0.2, 0.9],
    [0.52, 0.4, 0.55, 0.75, 0.75, 0.95, 0.9, 0.55]
  );

  // 4. Archival Display Nameplate
  addQuad(
    [-0.7, -0.95, 0.1],
    [0.7, -0.95, 0.1],
    [0.7, -0.65, -0.05],
    [-0.7, -0.65, -0.05],
    [0, 0.3, 0.9],
    [0.1, 0.98, 0.9, 0.98, 0.9, 0.68, 0.1, 0.68]
  );

  return {
    positions: new Float32Array(pos),
    normals: new Float32Array(nor),
    uvs: new Float32Array(uvs),
    indices: new Uint16Array(ind)
  };
}

/**
 * STYLE 2: 🌿 3D Botanical Specimen / Fern / Plant
 */
function buildBotanicalGeometry() {
  const pos = [];
  const nor = [];
  const uvs = [];
  const ind = [];

  function addQuad(v1, v2, v3, v4, n, uvQuad) {
    const base = pos.length / 3;
    pos.push(...v1, ...v2, ...v3, ...v4);
    nor.push(...n, ...n, ...n, ...n);
    uvs.push(...uvQuad);
    ind.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  // Central Plant Stem (Cylinder from Y: -0.8 to Y: 0.9)
  const stemSegs = 6;
  for (let s = 0; s < stemSegs; s++) {
    const y0 = -0.8 + (s / stemSegs) * 1.7;
    const y1 = -0.8 + ((s + 1) / stemSegs) * 1.7;
    const r = 0.04 * (1 - s / stemSegs * 0.4);

    for (let i = 0; i < 4; i++) {
      const a0 = (i / 4) * Math.PI * 2;
      const a1 = ((i + 1) / 4) * Math.PI * 2;
      addQuad(
        [Math.cos(a0) * r, y0, Math.sin(a0) * r],
        [Math.cos(a1) * r, y0, Math.sin(a1) * r],
        [Math.cos(a1) * r, y1, Math.sin(a1) * r],
        [Math.cos(a0) * r, y1, Math.sin(a0) * r],
        [Math.cos(a0), 0, Math.sin(a0)],
        [0.48, 0.48, 0.52, 0.48, 0.52, 0.52, 0.48, 0.52]
      );
    }
  }

  // 8 Radiating 3D Curved Leaves
  const leafCount = 8;
  for (let i = 0; i < leafCount; i++) {
    const angle = i * 2.399;
    const y = -0.5 + (i / leafCount) * 1.2;
    const len = 0.65 + (1 - i / leafCount) * 0.35;
    const curveZ = Math.sin(angle);
    const curveX = Math.cos(angle);

    const root = [curveX * 0.03, y, curveZ * 0.03];
    const mid1 = [curveX * len * 0.5 + curveZ * 0.15, y + 0.15, curveZ * len * 0.5 - curveX * 0.15];
    const mid2 = [curveX * len * 0.5 - curveZ * 0.15, y + 0.15, curveZ * len * 0.5 + curveX * 0.15];
    const tip = [curveX * len, y - 0.1, curveZ * len];

    addQuad(
      root, mid1, tip, mid2,
      [0, 1, 0],
      [0.5, 0.3, 0.1, 0.5, 0.5, 0.1, 0.9, 0.5]
    );
  }

  // Specimen Mount Placard at base
  addQuad(
    [-0.7, -0.98, 0.1],
    [0.7, -0.98, 0.1],
    [0.7, -0.7, -0.05],
    [-0.7, -0.7, -0.05],
    [0, 0.3, 0.9],
    [0.1, 0.98, 0.9, 0.98, 0.9, 0.68, 0.1, 0.68]
  );

  return {
    positions: new Float32Array(pos),
    normals: new Float32Array(nor),
    uvs: new Float32Array(uvs),
    indices: new Uint16Array(ind)
  };
}

/**
 * STYLE 3: 🏛️ 3D Museum Exhibition Pedestal Exhibit
 */
function buildPedestalGeometry() {
  const pos = [];
  const nor = [];
  const uvs = [];
  const ind = [];

  function addQuad(v1, v2, v3, v4, n, uvQuad) {
    const base = pos.length / 3;
    pos.push(...v1, ...v2, ...v3, ...v4);
    nor.push(...n, ...n, ...n, ...n);
    uvs.push(...uvQuad);
    ind.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  const sides = 8;
  const bR = 0.7;
  for (let i = 0; i < sides; i++) {
    const a0 = (i / sides) * Math.PI * 2;
    const a1 = ((i + 1) / sides) * Math.PI * 2;
    const x0 = Math.cos(a0) * bR, z0 = Math.sin(a0) * bR;
    const x1 = Math.cos(a1) * bR, z1 = Math.sin(a1) * bR;

    addQuad(
      [x0, -0.95, z0], [x1, -0.95, z1], [x1, -0.8, z1], [x0, -0.8, z0],
      [Math.cos((a0 + a1) / 2), 0, Math.sin((a0 + a1) / 2)],
      [0.05, 0.95, 0.95, 0.95, 0.95, 0.9, 0.05, 0.9]
    );

    addQuad(
      [0, -0.8, 0], [x0, -0.8, z0], [x1, -0.8, z1], [0, -0.8, 0],
      [0, 1, 0],
      [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
    );
  }

  // Brass Armature Rod
  addQuad(
    [-0.04, -0.8, -0.04], [0.04, -0.8, -0.04], [0.04, 0.0, -0.04], [-0.04, 0.0, -0.04],
    [0, 0, -1],
    [0.48, 0.48, 0.52, 0.48, 0.52, 0.52, 0.48, 0.52]
  );
  addQuad(
    [-0.04, -0.8, 0.04], [0.04, -0.8, 0.04], [0.04, 0.0, 0.04], [-0.04, 0.0, 0.04],
    [0, 0, 1],
    [0.48, 0.48, 0.52, 0.48, 0.52, 0.52, 0.48, 0.52]
  );

  // Angled Specimen Plaque
  const w = 0.85;
  const h = 0.95;
  const zTilt = 0.12;

  addQuad(
    [-w, -h + 0.3, zTilt],
    [w, -h + 0.3, zTilt],
    [w, h + 0.3, -zTilt],
    [-w, h + 0.3, -zTilt],
    [0, 0.1, 1],
    [0, 1, 1, 1, 1, 0, 0, 0]
  );

  addQuad(
    [-w, -h + 0.3, zTilt - 0.06],
    [-w, h + 0.3, -zTilt - 0.06],
    [w, h + 0.3, -zTilt - 0.06],
    [w, -h + 0.3, zTilt - 0.06],
    [0, -0.1, -1],
    [1, 1, 1, 0, 0, 0, 0, 1]
  );

  addQuad(
    [w, -h + 0.3, zTilt], [w, -h + 0.3, zTilt - 0.06], [w, h + 0.3, -zTilt - 0.06], [w, h + 0.3, -zTilt],
    [1, 0, 0], [0.95, 0.95, 0.95, 0.05, 0.98, 0.05, 0.98, 0.95]
  );
  addQuad(
    [-w, -h + 0.3, zTilt - 0.06], [-w, -h + 0.3, zTilt], [-w, h + 0.3, -zTilt], [-w, h + 0.3, -zTilt - 0.06],
    [-1, 0, 0], [0.02, 0.95, 0.05, 0.95, 0.05, 0.05, 0.02, 0.05]
  );

  return {
    positions: new Float32Array(pos),
    normals: new Float32Array(nor),
    uvs: new Float32Array(uvs),
    indices: new Uint16Array(ind)
  };
}

/**
 * Main export: generates complete 3D specimen GLB for a given species or uploaded image.
 */
export async function generateSpecimen3D({
  commonName,
  scientificName,
  categoryName = '',
  conservationStatus,
  imageBuffer,
  style = 'relief'
}) {
  let resolvedStyle = style;
  if (!resolvedStyle || resolvedStyle === 'auto') {
    // If an image is provided, default to 3D Sculpted Depth Mesh!
    if (imageBuffer && imageBuffer.length > 0) {
      resolvedStyle = 'relief';
    } else {
      const cat = (categoryName || '').toLowerCase();
      if (cat.includes('plant') || cat.includes('flora') || cat.includes('tree') || cat.includes('fern') || cat.includes('flower')) {
        resolvedStyle = 'botanical';
      } else if (cat.includes('pedestal') || cat.includes('museum') || cat.includes('archive')) {
        resolvedStyle = 'pedestal';
      } else {
        resolvedStyle = 'butterfly';
      }
    }
  }

  // Generate appropriate 3D mesh geometry
  let geom;
  if (resolvedStyle === 'relief') {
    geom = await buildImageReliefGeometry(imageBuffer);
  } else if (resolvedStyle === 'botanical') {
    geom = buildBotanicalGeometry();
  } else if (resolvedStyle === 'pedestal') {
    geom = buildPedestalGeometry();
  } else {
    geom = buildButterflyGeometry();
  }

  // Generate matching texture
  const textureBuffer = await generateCreatureTexture({
    commonName,
    scientificName,
    categoryName,
    conservationStatus,
    imageBuffer,
    style: resolvedStyle
  });

  return assembleGlb({
    name: commonName || 'Specimen',
    positions: geom.positions,
    normals: geom.normals,
    uvs: geom.uvs,
    indices: geom.indices,
    textureBuffer,
    materialOptions: {
      metallic: resolvedStyle === 'relief' ? 0.05 : 0.2,
      roughness: resolvedStyle === 'relief' ? 0.5 : 0.35
    }
  });
}

function assembleGlb({ name, positions, normals, uvs, indices, textureBuffer, materialOptions = {} }) {
  const pBuf = pad4(Buffer.from(positions.buffer));
  const nBuf = pad4(Buffer.from(normals.buffer));
  const uBuf = pad4(Buffer.from(uvs.buffer));
  const iBuf = pad4(Buffer.from(indices.buffer));

  let imgBuf = null;
  if (textureBuffer && textureBuffer.length > 0) {
    imgBuf = pad4(textureBuffer);
  }

  const buffersToConcat = [pBuf, nBuf, uBuf, iBuf];
  if (imgBuf) buffersToConcat.push(imgBuf);

  const binBuffer = Buffer.concat(buffersToConcat);

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    minX = Math.min(minX, positions[i]);
    minY = Math.min(minY, positions[i + 1]);
    minZ = Math.min(minZ, positions[i + 2]);
    maxX = Math.max(maxX, positions[i]);
    maxY = Math.max(maxY, positions[i + 1]);
    maxZ = Math.max(maxZ, positions[i + 2]);
  }

  const bufferViews = [
    { buffer: 0, byteOffset: 0, byteLength: pBuf.length, target: 34962 },
    { buffer: 0, byteOffset: pBuf.length, byteLength: nBuf.length, target: 34962 },
    { buffer: 0, byteOffset: pBuf.length + nBuf.length, byteLength: uBuf.length, target: 34962 },
    { buffer: 0, byteOffset: pBuf.length + nBuf.length + uBuf.length, byteLength: iBuf.length, target: 34963 }
  ];

  const gltf = {
    asset: { version: "2.0", generator: "BIODIVERSITY Specimen 3D Engine" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: name.replace(/[^a-zA-Z0-9_-]/g, '_') }],
    meshes: [{
      name: `${name}_Mesh`,
      primitives: [{
        attributes: {
          POSITION: 0,
          NORMAL: 1,
          TEXCOORD_0: 2
        },
        indices: 3,
        material: 0
      }]
    }],
    materials: [{
      name: "SpecimenMaterial",
      pbrMetallicRoughness: {
        metallicFactor: materialOptions.metallic ?? 0.15,
        roughnessFactor: materialOptions.roughness ?? 0.4
      },
      doubleSided: true
    }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: positions.length / 3,
        type: "VEC3",
        max: [maxX, maxY, maxZ],
        min: [minX, minY, minZ]
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: normals.length / 3,
        type: "VEC3"
      },
      {
        bufferView: 2,
        componentType: 5126,
        count: uvs.length / 2,
        type: "VEC2"
      },
      {
        bufferView: 3,
        componentType: 5123,
        count: indices.length,
        type: "SCALAR"
      }
    ],
    bufferViews,
    buffers: [{ byteLength: binBuffer.length }]
  };

  if (imgBuf) {
    const imgOffset = pBuf.length + nBuf.length + uBuf.length + iBuf.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: imgOffset,
      byteLength: textureBuffer.length
    });

    gltf.images = [{
      bufferView: 4,
      mimeType: "image/jpeg",
      name: "specimen_texture"
    }];

    gltf.samplers = [{
      magFilter: 9729,
      minFilter: 9987,
      wrapS: 10497,
      wrapT: 10497
    }];

    gltf.textures = [{ sampler: 0, source: 0 }];
    gltf.materials[0].pbrMetallicRoughness.baseColorTexture = { index: 0 };
  } else {
    gltf.materials[0].pbrMetallicRoughness.baseColorFactor = materialOptions.color ?? [0.3, 0.45, 0.35, 1.0];
  }

  let jsonBuf = Buffer.from(JSON.stringify(gltf), 'utf8');
  const jsonRem = jsonBuf.length % 4;
  if (jsonRem !== 0) {
    jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(4 - jsonRem, 0x20)]);
  }

  const totalLength = 12 + 8 + jsonBuf.length + 8 + binBuffer.length;

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546C67, 0); // 'glTF'
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(jsonBuf.length, 0);
  jsonChunkHeader.writeUInt32LE(0x4E4F534A, 4); // 'JSON'

  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(binBuffer.length, 0);
  binChunkHeader.writeUInt32LE(0x004E4942, 4); // 'BIN\0'

  return Buffer.concat([header, jsonChunkHeader, jsonBuf, binChunkHeader, binBuffer]);
}
