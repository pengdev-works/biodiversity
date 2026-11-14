import { Suspense, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, Html, ContactShadows } from '@react-three/drei';
import { Loader, RotateCw, RefreshCw, ZoomIn } from 'lucide-react';

function Model({ url }) {
  const { scene } = useGLTF(url);
  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 bg-forest-dark/90 px-4 py-3 rounded-2xl border border-cream/10 text-sage backdrop-blur-sm shadow-xl">
        <Loader className="w-6 h-6 animate-spin text-earth-light" />
        <span className="text-xs font-mono tracking-wider text-cream">Rendering 3D Specimen...</span>
      </div>
    </Html>
  );
}

export default function ThreeDViewer({ modelUrl, className = '' }) {
  const [autoRotate, setAutoRotate] = useState(false);
  const controlsRef = useRef(null);

  if (!modelUrl) return null;

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className={`relative bg-gradient-to-b from-forest-dark via-[#101B14] to-forest-dark rounded-2xl overflow-hidden min-h-[300px] sm:min-h-[440px] ${className}`}>
      {/* 3D Viewport Controls Toolbar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 sm:gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-cream/15 text-xs text-cream/80 shadow-lg">
        <button
          onClick={() => setAutoRotate(prev => !prev)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition min-h-[32px] sm:min-h-0 ${
            autoRotate ? 'bg-sage text-forest font-semibold shadow-xs' : 'hover:text-cream active:bg-white/10'
          }`}
          title="Toggle 360° Auto-Rotation"
        >
          <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
          <span className="text-[11px] sm:text-xs">{autoRotate ? 'Rotating' : 'Rotate'}</span>
        </button>

        <span className="text-cream/20">|</span>

        <button
          onClick={resetCamera}
          className="flex items-center gap-1 hover:text-cream transition px-2.5 py-1 rounded-full min-h-[32px] sm:min-h-0 active:bg-white/10"
          title="Reset View to Front"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="text-[11px] sm:text-xs">Reset</span>
        </button>
      </div>

      {/* Helpful Hint Overlay */}
      <div className="absolute bottom-3 left-3 sm:left-4 z-10 pointer-events-none flex items-center gap-2 text-[10px] sm:text-[11px] text-cream/60 font-mono bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full border border-cream/10">
        <ZoomIn className="w-3 h-3 text-sage shrink-0" />
        <span>Touch or drag to rotate • Pinch or scroll to zoom</span>
      </div>

      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            console.warn('[ThreeDViewer] WebGL context lost, will restore automatically.');
          }, false);
        }}
      >
        {/* Gallery Exhibition Lighting */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} />
        <directionalLight position={[-5, -2, -5]} intensity={0.4} />
        <pointLight position={[0, 4, 3]} intensity={0.6} />

        <Suspense fallback={<LoadingFallback />}>
          <Model url={modelUrl} />
          {/* Ground Soft Contact Shadow */}
          <ContactShadows position={[0, -1.2, 0]} opacity={0.6} scale={4} blur={2} far={2.5} />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          autoRotate={autoRotate}
          autoRotateSpeed={1.2}
          enableZoom={true}
          minDistance={1.2}
          maxDistance={8}
          enablePan={false}
        />
      </Canvas>
    </div>
  );
}
