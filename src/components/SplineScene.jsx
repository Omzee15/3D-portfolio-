import { useState, useEffect } from 'react';
import Spline from '@splinetool/react-spline';
import Loader from './Loader';

export default function SplineScene() {
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [showEnterButton, setShowEnterButton] = useState(false);
  const [hideLoader, setHideLoader] = useState(false);

  useEffect(() => {
    // Wait for 4 seconds after scene loads to show the enter button
    if (sceneLoaded) {
      const timer = setTimeout(() => {
        setShowEnterButton(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [sceneLoaded]);

  const handleLoad = () => {
    console.log('Scene loaded');
    setSceneLoaded(true);
  };

  const handleEnterPortfolio = () => {
    setHideLoader(true);
  };

  return (
    <>
      <Loader 
        showEnterButton={showEnterButton} 
        onEnter={handleEnterPortfolio}
        hide={hideLoader}
      />
      <main className="spline-container">
        <Spline 
          // scene="https://prod.spline.design/DAAeGsrIvKrDX-jN/scene.splinecode"
          scene="https://prod.spline.design/vpWwEHAIMcsjsuQx/scene.splinecode"
          style={{ width: '100%', height: '100vh' }}
          onLoad={handleLoad}
          onError={(error) => console.error('Spline error:', error)}
        />
      </main>
    </>
  );
}
