import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCw, ZoomIn, ZoomOut, Maximize2, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

/**
 * SpeciesThreeDViewer
 * Professional Three.js WebGL viewport for inspecting realistic 3D biodiversity models (.glb / .gltf).
 * Features:
 * - GLTFLoader with loading progress tracking
 * - Bounding-box auto-centering and scaling
 * - OrbitControls (smooth mouse & touch 360° rotation and zoom)
 * - Subtle floating levitation animation
 * - Studio 3-point lighting + soft ground contact shadow
 * - Full memory/texture/geometry disposal on unmount to prevent leaks
 * - UI controls: Auto-rotate toggle, Zoom In/Out, Reset View, Fullscreen toggle
 */
export default function SpeciesThreeDViewer({
  modelUrl,
  speciesName = 'Specimen 3D Model',
  className = ''
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Status states
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);
  const [autoRotate, setAutoRotate] = useState(true);

  // References to Three.js objects
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const modelRef = useRef(null);
  const frameIdRef = useRef(null);
  const initialCamPos = useRef({ x: 0, y: 1.5, z: 3.5 });

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    let isDisposed = false;
    setLoading(true);
    setLoadingProgress(0);
    setError(null);

    // If no model URL provided
    if (!modelUrl) {
      setLoading(false);
      setError('No 3D model available for this specimen yet.');
      return;
    }

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Subtle dark botanical fog for depth
    scene.fog = new THREE.FogExp2(0x06140b, 0.12);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.4, 3.2);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 1.2;
    controls.maxDistance = 6.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Prevent going beneath floor
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.5;
    controlsRef.current = controls;

    // 5. Studio Exhibition Lighting for Photorealistic Insects
    // Subtle ambient environmental bounce
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.9);
    scene.add(ambientLight);

    // Warm sun key light (casting soft ray-shadows)
    const keyLight = new THREE.DirectionalLight(0xfffaf0, 3.2);
    keyLight.position.set(4, 6, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Emerald forest ground bounce light
    const fillLight = new THREE.DirectionalLight(0x34d399, 1.4);
    fillLight.position.set(-4, 2, -2);
    scene.add(fillLight);

    // Sharp specular rim light to accentuate wing edges & abdominal spines
    const rimLight = new THREE.DirectionalLight(0xa7f3d0, 2.5);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // Soft spotlight highlighting specimen center
    const spotLight = new THREE.SpotLight(0xffedd5, 2.0);
    spotLight.position.set(0, 5, 2);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.8;
    scene.add(spotLight);

    // Soft ground contact shadow plane
    const shadowGeo = new THREE.PlaneGeometry(5, 5);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.7;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // Circular pedestal ring
    const ringGeo = new THREE.RingGeometry(0.85, 0.88, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = -0.69;
    scene.add(ringMesh);

    // 6. Load GLTF / GLB Model
    const loader = new GLTFLoader();
    let loadedModel = null;
    let baseModelY = 0;

    loader.load(
      modelUrl,
      (gltf) => {
        if (isDisposed) return;

        loadedModel = gltf.scene;
        modelRef.current = loadedModel;

        // Compute bounding box to auto-center and normalize size
        const box = new THREE.Box3().setFromObject(loadedModel);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Desired target max dimension (~1.8 units)
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.8 / (maxDim || 1);
        loadedModel.scale.set(scale, scale, scale);

        // Center specimen
        loadedModel.position.x = -center.x * scale;
        loadedModel.position.y = -center.y * scale + 0.05;
        loadedModel.position.z = -center.z * scale;
        baseModelY = loadedModel.position.y;

        // Enable realistic lighting, biological materials, and insect specular reflections
        loadedModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            const meshName = (child.name || '').toLowerCase();
            const mat = child.material;

            if (mat) {
              const matName = (mat.name || '').toLowerCase();

              // Check if mesh or material belongs to the wings
              if (
                matName.includes('wing') ||
                matName.includes('membrane') ||
                meshName.includes('wing') ||
                meshName.includes('membrane')
              ) {
                // Photorealistic chitin wings: glass-like transparency with amber venation tint
                mat.transparent = true;
                mat.opacity = 0.58;
                mat.roughness = 0.12;
                mat.metalness = 0.15;
                mat.clearcoat = 1.0;
                mat.clearcoatRoughness = 0.08;
                mat.transmission = 0.65;
                mat.ior = 1.54; // Natural insect chitin refraction index
                mat.side = THREE.DoubleSide;
                mat.depthWrite = false;
                mat.color = new THREE.Color(0xd49b42); // Authentic golden-amber chitin tint
              } else if (
                matName.includes('eye') ||
                meshName.includes('eye')
              ) {
                // Compound ommatidia insect eyes: glossy dark iridescent sheen
                mat.roughness = 0.08;
                mat.metalness = 0.35;
                mat.clearcoat = 1.0;
                mat.clearcoatRoughness = 0.05;
                mat.color = new THREE.Color(0x1a2e1d);
              } else if (
                matName.includes('leaf') ||
                meshName.includes('leaf')
              ) {
                // Organic green vegetation leaf surface with soft subsurface feel
                mat.roughness = 0.55;
                mat.metalness = 0.02;
                mat.clearcoat = 0.25;
                mat.clearcoatRoughness = 0.4;
                mat.color = new THREE.Color(0x23531b);
              } else {
                // Exoskeleton / thorax / abdomen / legs: glossy chitinous cuticle
                mat.roughness = 0.32;
                mat.metalness = 0.22;
                mat.clearcoat = 0.85;
                mat.clearcoatRoughness = 0.18;
                if (mat.color) {
                  // Enhance rich natural amber color
                  mat.color = new THREE.Color(0x9e4e16);
                }
              }
            }
          }
        });

        scene.add(loadedModel);
        setLoading(false);
      },
      (xhr) => {
        if (xhr.total > 0) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          setLoadingProgress(percent);
        } else {
          // Dynamic chunk progress fallback
          setLoadingProgress((prev) => Math.min(prev + 12, 90));
        }
      },
      (err) => {
        console.error('Three.js GLTF Loader error:', err);
        if (!isDisposed) {
          setLoading(false);
          setError('Failed to load 3D specimen geometry. Please check file format.');
        }
      }
    );

    // 7. Render Animation Loop with Floating Effect
    const clock = new THREE.Clock();

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Gentle floating levitation animation
      if (loadedModel) {
        loadedModel.position.y = baseModelY + Math.sin(elapsedTime * 1.6) * 0.045;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 8. Responsive resize handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // 9. Cleanup and Resource Disposal on Unmount
    return () => {
      isDisposed = true;
      window.removeEventListener('resize', handleResize);

      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }

      // Dispose Three.js objects to avoid memory leaks
      scene.traverse((object) => {
        if (!object.isMesh) return;
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => {
              cleanMaterial(mat);
              mat.dispose();
            });
          } else {
            cleanMaterial(object.material);
            object.material.dispose();
          }
        }
      });

      controls.dispose();
      renderer.dispose();
    };
  }, [modelUrl]);

  // Helper to dispose textures in materials
  const cleanMaterial = (mat) => {
    Object.keys(mat).forEach((prop) => {
      if (mat[prop] && typeof mat[prop].dispose === 'function' && mat[prop].isTexture) {
        mat[prop].dispose();
      }
    });
  };

  // Sync autoRotate state with OrbitControls
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Controls UI handlers
  const handleResetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 1.4, 3.2);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const handleZoom = (delta) => {
    if (cameraRef.current && controlsRef.current) {
      const zoomFactor = delta > 0 ? 0.85 : 1.15;
      cameraRef.current.position.multiplyScalar(zoomFactor);
      controlsRef.current.update();
    }
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.log(err));
    } else {
      document.exitFullscreen().catch((err) => console.log(err));
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[400px] sm:h-[480px] lg:h-[540px] rounded-3xl overflow-hidden bg-gradient-to-b from-[#07170e] via-[#040e08] to-[#020704] border border-emerald-500/20 shadow-2xl select-none ${className}`}
    >
      {/* Three.js WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing outline-none"
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-[#06140b]/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-30">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-900 border-t-emerald-400 rounded-full animate-spin" />
            <Sparkles className="w-5 h-5 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-emerald-300 tracking-wider uppercase font-mono">
              Loading 3D Specimen
            </p>
            <p className="text-xs text-emerald-400/70 mt-1 font-mono">
              {loadingProgress}% completed
            </p>
          </div>
          <div className="w-48 h-1.5 bg-emerald-950/80 rounded-full overflow-hidden border border-emerald-500/20">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Fallback */}
      {error && (
        <div className="absolute inset-0 bg-[#06140b]/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-white mb-1">
            3D Specimen Unavailable
          </h4>
          <p className="text-xs text-emerald-300/70 max-w-sm mb-4">
            {error}
          </p>
          <div className="text-[11px] text-emerald-400/50 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 font-mono">
            Switch to Photo View to inspect high-resolution field photography.
          </div>
        </div>
      )}

      {/* Top Floating Badges */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-[#092214]/85 backdrop-blur-md text-emerald-300 border border-emerald-500/30 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Interactive 3D Engine
        </span>
        <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-black/50 backdrop-blur-md text-emerald-300/70 border border-white/10">
          WebGL • Three.js
        </span>
      </div>

      {/* Bottom Interaction Hint */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 text-[11px] text-emerald-300/80 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-emerald-500/20 pointer-events-none">
        <RotateCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
        <span>Drag to rotate 360° • Pinch / scroll to zoom</span>
      </div>

      {/* Control Tools Toolbar */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1.5 rounded-2xl border border-emerald-500/20 shadow-xl">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          title={autoRotate ? 'Pause Auto-Rotation' : 'Resume Auto-Rotation'}
          className={`p-2 rounded-xl transition-all ${
            autoRotate
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-emerald-400/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
        </button>

        <button
          onClick={() => handleZoom(1)}
          title="Zoom In"
          className="p-2 text-emerald-400/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleZoom(-1)}
          title="Zoom Out"
          className="p-2 text-emerald-400/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={handleResetCamera}
          title="Reset View"
          className="p-2 text-emerald-400/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <button
          onClick={handleToggleFullscreen}
          title="Toggle Fullscreen"
          className="p-2 text-emerald-400/70 hover:text-white hover:bg-white/10 rounded-xl transition-all hidden sm:block"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
