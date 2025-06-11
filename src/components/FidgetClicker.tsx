import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

export function FidgetClicker() {
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const updatePosition = () => {
      const angle = (rotation * Math.PI) / 180;
      const radius = 100;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      setPosition({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    };

    if (isActive) {
      const interval = setInterval(() => {
        setRotation(prev => (prev + 5) % 360);
        updatePosition();
      }, 16);

      return () => clearInterval(interval);
    }
  }, [isActive, rotation]);

  const handleClick = () => {
    setIsActive(prev => !prev);
  };

  return (
    <button
      onClick={handleClick}
      className={`fixed z-50 transition-all duration-300 transform ${
        isActive ? 'scale-110' : 'scale-100 hover:scale-105'
      }`}
      style={{
        left: isActive ? `${position.x}px` : '50%',
        top: isActive ? `${position.y}px` : '70%',
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      }}
    >
      <div className="relative">
        <div className={`
          w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary
          shadow-lg flex items-center justify-center
          transition-all duration-300
          ${isActive ? 'animate-spin' : ''}
        `}>
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        {isActive && (
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
        )}
      </div>
    </button>
  );
}