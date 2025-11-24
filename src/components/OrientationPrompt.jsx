import { useState, useEffect } from 'react';
import './OrientationPrompt.css';

export default function OrientationPrompt({ children }) {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Check if device is mobile (screen width less than 768px)
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Check if orientation is portrait
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait && mobile);
    };

    // Check on mount
    checkOrientation();

    // Add event listeners
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (isPortrait && isMobile) {
    return (
      <div className="orientation-prompt">
        <div className="orientation-prompt-content">
          <div className="phone-icon">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="rotate-phone-icon"
            >
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
          </div>
          <h2>Please Rotate Your Device</h2>
          <p>This experience is best viewed in landscape mode</p>
          <div className="rotation-indicator">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="arrow-icon"
            >
              <polyline points="17 1 21 5 17 9"></polyline>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}