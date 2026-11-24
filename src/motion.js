import {useEffect, useRef} from 'react';

export function usePageMotion(root, deps = []) {
  useEffect(() => {
    let media;
    let alive = true;
    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{gsap}, {ScrollTrigger}]) => {
      if (!alive || !root.current) return;
      gsap.registerPlugin(ScrollTrigger);
      media = gsap.matchMedia(root.current);
      media.add('(prefers-reduced-motion: no-preference)', () => {
        // 1. Page entrance elements (Hero, breadcrumb, page headings, banner intro)
        const introElements = root.current.querySelectorAll('[data-intro]');
        if (introElements.length) {
          gsap.from(introElements, {
            opacity: 0,
            y: 30,
            duration: 0.9,
            stagger: 0.1,
            ease: 'power3.out',
            clearProps: 'opacity,transform',
          });
        }

        // 2. Interior banner cover images (gentle zoom-in and fade)
        const coverImages = root.current.querySelectorAll('.collection-cover img, .contact-image img, .portrait-top img');
        if (coverImages.length) {
          gsap.from(coverImages, {
            opacity: 0.45,
            scale: 1.08,
            duration: 1.25,
            ease: 'power2.out',
            clearProps: 'opacity,transform',
          });
        }

        // 3. Scroll reveal sections: trigger at 'top 75%' so the element is comfortably 25% inside the screen before animating
        const revealElements = root.current.querySelectorAll('[data-reveal], .area-section, .local-section, .listing-overview, .listing-features, .listing-location, .valuation-section, .similar-listings, .region-directory, .editorial-article, .journal-entry');
        revealElements.forEach(element => {
          gsap.from(element, {
            opacity: 0,
            y: 46,
            duration: 1.05,
            ease: 'power3.out',
            clearProps: 'opacity,transform',
            scrollTrigger: {
              trigger: element,
              start: 'top 75%',
              once: true,
            },
          });
        });

        // 4. Stagger reveal for listing cards: batch triggered at 'top 80%' as user scrolls to each row
        const cards = root.current.querySelectorAll('.property');
        if (cards.length) {
          ScrollTrigger.batch(cards, {
            start: 'top 80%',
            once: true,
            onEnter: batch => gsap.from(batch, {
              opacity: 0,
              y: 44,
              duration: 0.9,
              stagger: 0.13,
              ease: 'power3.out',
              clearProps: 'opacity,transform',
            }),
          });
        }

        window.requestAnimationFrame(() => {
          ScrollTrigger.refresh();
        });
      }, root.current);

      media.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
        const heroImages = root.current.querySelector('.hero-images');
        const hero = root.current.querySelector('.hero');
        if (heroImages && hero) {
          gsap.to(heroImages, {
            yPercent: 8,
            ease: 'none',
            scrollTrigger: {
              trigger: hero,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          });
        }
      });
    });

    return () => {
      alive = false;
      media?.revert();
    };
  }, deps);
}

export const useEditorialMotion = usePageMotion;

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
        {opacity: .35, x: 20 * (direction?.current ?? 1), scale: 1.06},
        {opacity: 1, x: 0, scale: 1, duration: .7, ease: 'power3.out', clearProps: 'opacity,transform'},
      );
    });
    return () => { alive = false; animation?.revert(); };
  }, [image, index, direction]);
}
