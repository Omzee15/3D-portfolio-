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
          <div className="message-content">
            <p>Hey,</p>
            <p>I appreciate you coming here,</p>
            <p>But The true fun of the website is seen using a desktop.</p>
            <p>I know it isnt the most ideal thing.</p>
            <p>Have Fun</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}