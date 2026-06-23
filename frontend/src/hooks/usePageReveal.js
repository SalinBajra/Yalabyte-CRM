import { useEffect } from 'react';

export default function usePageReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll('.page-reveal');

    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -44px' });

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
}
