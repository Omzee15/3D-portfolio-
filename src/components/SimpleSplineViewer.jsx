import { useEffect, useRef } from 'react';

export default function SimpleSplineViewer() {
  const containerRef = useRef(null);
  // const url = "https://prod.spline.design/DAAeGsrIvKrDX-jN/scene.splinecode";
  const url = "https://prod.spline.design/vpWwEHAIMcsjsuQx/scene.splinecode";
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Using the Spline runtime instead of React components
    async function loadSpline() {
      try {
        // Dynamically import the Spline viewer
        const { Application } = await import('@splinetool/runtime');
        
        // Create a new Spline application
        const spline = new Application(containerRef.current);
        
        // Load the scene
        await spline.load(url);
        
        console.log('Spline scene loaded successfully');
      } catch (error) {
        console.error('Error loading Spline scene:', error);
      }
    }
    
    loadSpline();
  }, []);
  
  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100vh', 
        overflow: 'hidden',
        position: 'relative'
      }}
    />
  );
}