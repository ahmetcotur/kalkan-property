import React, {useEffect, useRef, useState} from 'react';
import {ArrowUpRight, ChevronLeft, ChevronRight, ImageOff, Images, Play, X} from 'lucide-react';
import {useImageMotion} from './motion.js';

const previewLimit = 4;

function GalleryImage({photo,imageRef,...props}) {
  const [failed,setFailed] = useState(false);
  return failed ? <span className="photo-unavailable" role="img" aria-label="Photo unavailable"><ImageOff size={22}/><span>Photo unavailable</span></span> :
    <img ref={imageRef} src={photo} onError={() => setFailed(true)} {...props}/>;
}

export function VideoPreview({item, variant, onVisibilityChange}) {
  const [active,setActive] = useState(null);
  const dialog = useRef(null);
  const trigger = useRef(null);
  if (!item.videos.length) return null;
  function open() {
    setActive(item.videos[0]);
    onVisibilityChange?.(true);
    dialog.current.showModal();
  }
  function close() {
    setActive(null);
    onVisibilityChange?.(false);
    trigger.current?.focus({preventScroll:true});
  }
  return <>
    <button ref={trigger} type="button" className={'video-trigger ' + variant} onClick={open}
      aria-label={'Watch YouTube preview: ' + item.name} aria-haspopup="dialog"><Play fill="currentColor" size={15} aria-hidden="true"/><span>YouTube preview</span></button>
    <dialog ref={dialog} className="video-dialog" aria-label={'YouTube preview: ' + item.name} onClose={close}
      onClick={event => { if (event.target===event.currentTarget) dialog.current.close(); }}>
      {active && <div className="video-shell">
        <header><div><p className="kicker">PROPERTY VIDEO · {item.id}</p><h2>{item.name}</h2></div>
          <button type="button" autoFocus className="icon-button" onClick={() => dialog.current.close()} aria-label="Close video preview"><X size={22}/></button></header>
        <iframe key={active} src={'https://www.youtube-nocookie.com/embed/' + active + '?autoplay=1&playsinline=1'} title={item.name + ' video on YouTube'}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>
        <footer>
          {item.videos.length>1 && <div className="video-switch" aria-label="Property videos">{item.videos.map((video,index) =>
            <button key={video} type="button" aria-pressed={video===active} onClick={() => setActive(video)}>Video {index+1}</button>
          )}</div>}
          <a href={'https://www.youtube.com/watch?v=' + active} target="_blank" rel="noopener noreferrer">Watch on YouTube <ArrowUpRight size={15}/></a>
        </footer>
      </div>}
    </dialog>
  </>;
}

const cardDelay = 2200;

function preloadPhoto(src) {
  const image = new Image();
  if (typeof image.decode === 'function') {
    image.src = src;
    return image.decode();
  }
  return new Promise((resolve,reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.src = src;
  });
}

export function CardPhotos({item, children, hover}) {
  const [frame,setFrame] = useState({current:0,previous:null,revision:0});
  const [focused,setFocused] = useState(false);
  const [videoOpen,setVideoOpen] = useState(false);
  const requested = useRef(0);
  const requestVersion = useRef(0);
  const photos = item.photos.slice(0,item.previewCount || previewLimit);
  const count = photos.length;

  function change(delta) {
    const next = (requested.current + delta + count) % count;
    const version = ++requestVersion.current;
    requested.current = next;
    preloadPhoto(photos[next]).then(() => {
      if (version !== requestVersion.current) return;
      setFrame(current => current.current===next ? current : {current:next,previous:current.current,revision:current.revision+1});
    }).catch(() => {
      if (version === requestVersion.current) setFrame(current => ({...current,revision:current.revision+1}));
    });
  }

  useEffect(() => () => { requestVersion.current++; }, []);
  useEffect(() => {
    if (!hover || focused || videoOpen || count<2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setTimeout(() => change(1),cardDelay);
    return () => window.clearTimeout(timer);
  }, [hover,focused,videoOpen,frame.revision,count]);

  return <div className="card-media" onFocus={() => setFocused(true)}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    onKeyDown={event => {
      if (count<2 || !event.target.classList.contains('card-photo-step')) return;
      if (event.key==='ArrowLeft' || event.key==='ArrowRight') {
        event.preventDefault();
        change(event.key==='ArrowLeft' ? -1 : 1);
      }
    }}>
    <a className="card-image-link" href={item.path} tabIndex={-1} aria-hidden="true">
      {frame.previous !== null && <GalleryImage key={photos[frame.previous]} className="card-photo-layer card-photo-previous" photo={photos[frame.previous]} alt="" width="700" height="470"/>}
      <GalleryImage key={photos[frame.current]} className={frame.previous === null ? 'card-photo-layer' : 'card-photo-layer card-photo-enter'} photo={photos[frame.current]} alt="" loading={frame.revision===0 ? 'lazy' : 'eager'} width="700" height="470"/>
    </a>
    {children}
    {count>1 && <>
      <button type="button" className="card-photo-step previous" onClick={() => change(-1)} aria-label={'Previous card photo: ' + item.name}><ChevronLeft size={19}/></button>
      <button type="button" className="card-photo-step next" onClick={() => change(1)} aria-label={'Next card photo: ' + item.name}><ChevronRight size={19}/></button>
      <span className="card-photo-count" aria-live={hover && !focused ? 'off' : 'polite'}>{frame.current+1} / {count}</span>
    </>}
    <VideoPreview item={item} variant="card-video" onVisibilityChange={setVideoOpen}/>
  </div>;
}

export function Gallery({item}) {
  const [index,setIndex] = useState(0);
  const [showGallery,setShowGallery] = useState(false);
  const picture = useRef(null);
  const lightbox = useRef(null);
  const openTrigger = useRef(null);
  const direction = useRef(1);
  useImageMotion(picture,index,direction);
  const count = item.photos.length;
  function change(delta) {
    direction.current = delta;
    setIndex(value => (value + delta + count) % count);
  }
  function open(at,event) {
    openTrigger.current = event.currentTarget;
    setIndex(at);
    setShowGallery(true);
    lightbox.current.showModal();
  }
  function close() {
    setShowGallery(false);
    openTrigger.current?.focus({preventScroll:true});
  }
  const shown = item.photos.slice(0,item.previewCount || previewLimit);
  return <>
    <div className={'photo-spread photos-' + shown.length}>
      {shown.map((photo,i) => <button type="button" className="spread-photo" key={photo} onClick={event => open(i,event)} aria-label={'Open photo ' + (i+1)}>
        <GalleryImage photo={photo} alt={item.name + ', photograph ' + (i+1)} fetchPriority={i===0 ? 'high' : 'auto'}/>
      </button>)}
      <div className="spread-actions">
        <VideoPreview item={item} variant="detail-video"/>
        <button type="button" className="view-photos" onClick={event => open(0,event)}>
          <Images size={18}/> View gallery{count>1 && <span className="view-photos-count">{count}</span>}
        </button>
      </div>
    </div>
    <dialog ref={lightbox} className="listing-lightbox" aria-label={item.name + ' photo gallery'} onClose={close}
      onClick={event => { if (event.target===event.currentTarget) lightbox.current.close(); }}
      onKeyDown={event => {
        if (!['ArrowLeft','ArrowRight'].includes(event.key) || count<2) return;
        event.preventDefault();
        change(event.key==='ArrowLeft' ? -1 : 1);
      }}>
      {showGallery && <div className="lightbox-shell">
        <div className="lightbox-top"><span>{item.id} <small aria-live="polite">· {index+1} / {count}</small></span>
          <button type="button" autoFocus className="icon-button" aria-label="Close gallery" onClick={() => lightbox.current.close()}><X size={22}/></button>
        </div>
        <div className="lightbox-image">
          <GalleryImage photo={item.photos[index]} imageRef={picture} key={item.photos[index]} alt={item.name + ', photograph ' + (index+1)}/>
          {count>1 && <>
            <button type="button" className="icon-button previous" aria-label="Previous photo" onClick={() => change(-1)}><ChevronLeft/></button>
            <button type="button" className="icon-button next" aria-label="Next photo" onClick={() => change(1)}><ChevronRight/></button>
          </>}
        </div>
        {count>1 && <div className="lightbox-thumbs" aria-label="Gallery thumbnails">{item.photos.map((photo,i) =>
          <button type="button" key={photo} aria-label={'Show photo ' + (i+1)} aria-pressed={index===i} onClick={() => setIndex(i)}>
            <GalleryImage photo={photo} alt="" width="76" height="47" loading="lazy"/>
          </button>
        )}</div>}
      </div>}
    </dialog>
  </>;
}
