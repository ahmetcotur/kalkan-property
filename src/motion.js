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
          opacity: .85, y: 12, duration: .62, stagger: .07, ease: 'power3.out',
          clearProps: 'opacity,transform',
        });
        root.current.querySelectorAll('[data-reveal]').forEach(element => {
          gsap.from(element, {
            opacity: .25, y: 30, duration: .85, ease: 'power3.out',
            clearProps: 'opacity,transform',
            scrollTrigger: {trigger: element, start: 'top 94%', once: true},
          });
        });
      }, root.current);
      media.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.to(root.current.querySelector('.hero-images'), {
          yPercent: 7, ease: 'none', scrollTrigger: {
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
        {opacity: .45, x: 14 * (direction?.current ?? 1), scale: 1.045},
        {opacity: 1, x: 0, scale: 1, duration: .58, ease: 'power2.out', clearProps: 'opacity,transform'},
      );
    });
    return () => { alive = false; animation?.revert(); };
  }, [image, index, direction]);
}
