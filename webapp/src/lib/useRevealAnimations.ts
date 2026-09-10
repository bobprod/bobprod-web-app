import { useEffect } from 'react';

/**
 * Adds the `.in` class (see .reveal / .reveal.in in index.css) to any `.reveal` element
 * inside this component once it scrolls into view. Unobserves after triggering — the
 * animation only ever plays once per element.
 */
export function useRevealAnimations(deps: unknown[] = []) {
  useEffect(() => {
    const elements = document.querySelectorAll('.reveal:not(.in)');
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
