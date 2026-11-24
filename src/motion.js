import {useEffect, useRef} from 'react';

export function useEditorialMotion(root) {
  useEffect(() => {
    let media;
    let alive = true;
    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{gsap}, {ScrollTrigger}]) => {
      if (!alive || !root.current) return;
      gsap.registerPlugin(ScrollTrigger);
      media = gsap.matchMedia(root.current);
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('[data-intro]', {
          opacity: 0, y: 22, duration: .78, stagger: .09, ease: 'power3.out',
          clearProps: 'opacity,transform',
        });
        root.current.querySelectorAll('[data-reveal]').forEach(element => {
          gsap.from(element, {
            opacity: 0, y: 32, duration: .85, ease: 'power3.out',
            clearProps: 'opacity,transform',
            scrollTrigger: {trigger: element, start: 'top 92%', once: true},
          });
        });
        const propertyCards = root.current.querySelectorAll('.featured .property');
        if (propertyCards.length) {
          gsap.from(propertyCards, {
            opacity: 0, y: 32, duration: .75, stagger: .11, ease: 'power3.out',
            clearProps: 'opacity,transform',
            scrollTrigger: {trigger: '.featured .property-grid', start: 'top 90%', once: true},
          });
        }
      }, root.current);
      media.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.to(root.current.querySelector('.hero-images'), {
          yPercent: 8, ease: 'none', scrollTrigger: {
            trigger: root.current.querySelector('.hero'),
            start: 'top top', end: 'bottom top', scrub: true,
          },
        });
      });
    });
    return () => { alive = false; media?.revert(); };
  }, [root]);
}

export function useImageMotion(image, index, direction) {
  const previous = useRef(index);
  useEffect(() => {
    if (previous.current === index) return;
    previous.current = index;
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
    let alive = true;
    let animation;
    const node = image.current;
    import('gsap').then(({gsap}) => {
      if (!alive || !node) return;
      animation = gsap.fromTo(node,
        {opacity: .35, x: 18 * (direction?.current ?? 1), scale: 1.05},
        {opacity: 1, x: 0, scale: 1, duration: .65, ease: 'power3.out', clearProps: 'opacity,transform'},
      );
    });
    return () => { alive = false; animation?.revert(); };
  }, [image, index, direction]);
}
