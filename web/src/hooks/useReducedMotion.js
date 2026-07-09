import { useEffect, useState } from 'react';

/**
 * Tracks the user's prefers-reduced-motion setting.
 * @returns {boolean} True when reduced motion is requested by the OS/browser.
 * @sideEffects Subscribes to a media query listener while mounted.
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    function handleChange(event) {
      setPrefersReducedMotion(event.matches);
    }

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}
