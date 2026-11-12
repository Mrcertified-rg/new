import React, { useEffect, useRef, useState } from 'react';
import { coverOf, mediaBg } from '../products/media.js';

/** Product detail gallery: swipe through product photos and videos. */
export default function ProductMedia({ p }) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const images = Array.isArray(p.images) && p.images.length
    ? p.images
    : [coverOf(p)].filter(Boolean);
  const videos = Array.isArray(p.videos) && p.videos.length
    ? p.videos
    : [p.video || p.video_url].filter(Boolean);
  const slides = [
    ...images.map((src) => ({ type: 'image', src })),
    ...videos.map((src) => ({ type: 'video', src })),
  ];

  useEffect(() => {
    setIndex(0);
    trackRef.current?.scrollTo({ left: 0 });
  }, [p.id]);

  if (!slides.length) {
    return <div className="pd-media" style={{ background: mediaBg(p) }} aria-label={`${p.name} image placeholder`} />;
  }

  const onScroll = (event) => {
    const track = event.currentTarget;
    setIndex(Math.round(track.scrollLeft / Math.max(1, track.clientWidth)));
  };

  return (
    <div className="pd-media pm-gallery" role="group" aria-label={`${p.name} photos and videos`}>
      <div className="pm-track" ref={trackRef} onScroll={onScroll}>
        {slides.map((slide, slideIndex) => (slide.type === 'image'
          ? <div className="pm-slide" key={`image-${slideIndex}`} style={{ backgroundImage: `url("${slide.src}")` }} role="img" aria-label={`${p.name}, photo ${slideIndex + 1}`} />
          : (
            <div className="pm-slide" key={`video-${slideIndex}`}>
              <video src={typeof slide.src === 'string' ? slide.src : slide.src.url} poster={coverOf(p) || undefined} controls playsInline preload="metadata" />
            </div>
          )))}
      </div>
      {slides.length > 1 && <span className="pm-count">{index + 1}/{slides.length}</span>}
      {videos.length > 0 && slides[index]?.type !== 'video' && <span className="pm-videotag">VIDEO</span>}
      {slides.length > 1 && <div className="pm-dots" aria-hidden="true">{slides.map((_, slideIndex) => <i key={slideIndex} className={slideIndex === index ? 'on' : ''} />)}</div>}
    </div>
  );
}
