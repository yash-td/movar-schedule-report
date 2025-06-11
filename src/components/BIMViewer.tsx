import { useEffect, useRef, useState } from 'react';
import { Scene, WebGLRenderer, PerspectiveCamera, AmbientLight, DirectionalLight, Color, Box3, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Loader2, Upload } from "lucide-react";

export function BIMViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new Scene();
    scene.background = new Color(0x1a1a1a);

    const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const ambientLight = new AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      // File upload handling will be implemented later
      console.log("File upload not yet implemented");
    } catch (err) {
      setError("Error loading file. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={containerRef} className="w-full h-full" />
      
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
        <label className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 transition-colors">
          <input
            type="file"
            accept=".ifc"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isLoading}
          />
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 text-white animate-spin" />
              <span className="text-white">Loading...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 text-white" />
              <span className="text-white">Upload IFC File</span>
            </>
          )}
        </label>
      </div>

      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}