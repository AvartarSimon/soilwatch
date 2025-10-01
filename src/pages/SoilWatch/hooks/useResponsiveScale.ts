import { useState, useEffect } from 'react';

interface UseResponsiveScaleOptions {
  baseWidth?: number;
  baseHeight?: number;
  minScale?: number;
  maxScale?: number;
}

export const useResponsiveScale = (options: UseResponsiveScaleOptions = {}) => {
  const {
    baseWidth = 1920,
    baseHeight = 1080,
    minScale = 0.3,
    maxScale = 2.0
  } = options;

  const [scale, setScale] = useState(1);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const calculateScale = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate scale ratio based on width and height
      const scaleX = viewportWidth / baseWidth;
      const scaleY = viewportHeight / baseHeight;

      // Take the smaller value to ensure content fits the screen completely
      let calculatedScale = Math.min(scaleX, scaleY);

      // Apply minimum and maximum scale limits
      calculatedScale = Math.max(minScale, Math.min(maxScale, calculatedScale));

      setScale(calculatedScale);
      setDimensions({
        width: viewportWidth,
        height: viewportHeight
      });
    };

    // Initial calculation
    calculateScale();

    // Listen for window size changes
    const handleResize = () => {
      calculateScale();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [baseWidth, baseHeight, minScale, maxScale]);

  return {
    scale,
    dimensions,
    scaledWidth: baseWidth * scale,
    scaledHeight: baseHeight * scale
  };
};