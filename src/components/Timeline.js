"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Timeline.module.css";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function Timeline({ events }) {
  const containerRef = useRef(null);
  const todayRef = useRef(null);
  const [hoveredEvent, setHoveredEvent] = useState(null);

  // Auto-scroll to today's event on load
  useEffect(() => {
    if (todayRef.current && containerRef.current) {
      setTimeout(() => {
        const container = containerRef.current;
        const target = todayRef.current;
        const scrollLeft = target.offsetLeft - (container.clientWidth / 2) + (target.clientWidth / 2);
        
        container.scrollTo({
          left: scrollLeft,
          behavior: "smooth"
        });
      }, 500);
    }
  }, [events]);

  // Desktop Scroll handling (Mouse Wheel & Drag to scroll)
  useEffect(() => {
    const slider = containerRef.current;
    if (!slider) return;

    // 1. Mouse Wheel to Horizontal Scroll
    const handleWheel = (e) => {
      if (e.shiftKey) return; // Browser handles shift+scroll horizontally natively
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const isScrollingDown = e.deltaY > 0;
        // Check if we reached the scroll boundaries
        const isAtRightEdge = Math.ceil(slider.scrollLeft + slider.clientWidth) >= slider.scrollWidth - 1;
        const isAtLeftEdge = slider.scrollLeft <= 0;

        // If trying to scroll right but we are at the end, let the page scroll down naturally
        if (isScrollingDown && isAtRightEdge) return;
        // If trying to scroll left but we are at the beginning, let the page scroll up naturally
        if (!isScrollingDown && isAtLeftEdge) return;

        e.preventDefault();
        slider.scrollBy({
          left: e.deltaY > 0 ? 300 : -300,
          behavior: 'smooth'
        });
      }
    };

    // 2. Grab and Drag to Scroll
    let isDown = false;
    let startX;
    let scrollLeft;

    const onMouseDown = (e) => {
      isDown = true;
      slider.style.cursor = 'grabbing';
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    };
    const onMouseLeave = () => {
      isDown = false;
      slider.style.cursor = 'grab';
    };
    const onMouseUp = () => {
      isDown = false;
      slider.style.cursor = 'grab';
    };
    const onMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2; // Speed multiplier
      slider.scrollLeft = scrollLeft - walk;
    };

    slider.style.cursor = 'grab';
    slider.addEventListener('wheel', handleWheel, { passive: false });
    slider.addEventListener('mousedown', onMouseDown);
    slider.addEventListener('mouseleave', onMouseLeave);
    slider.addEventListener('mouseup', onMouseUp);
    slider.addEventListener('mousemove', onMouseMove);

    return () => {
      slider.removeEventListener('wheel', handleWheel);
      slider.removeEventListener('mousedown', onMouseDown);
      slider.removeEventListener('mouseleave', onMouseLeave);
      slider.removeEventListener('mouseup', onMouseUp);
      slider.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  // Handle video auto-play on hover
  useEffect(() => {
    const videos = document.querySelectorAll(`.${styles.eventVideo}`);
    videos.forEach(video => {
      if (video.dataset.id === hoveredEvent) {
        video.play().catch(e => console.log("Play interrupted:", e));
      } else {
        video.pause();
        // Optional: Reset to beginning
        // video.currentTime = 0; 
      }
    });
  }, [hoveredEvent]);

  // Group events by Month-Year for the timeline markers
  const groupedEvents = [];
  let currentGroup = "";

  const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the closest event to today
  let closestFutureEventId = null;
  let minDiff = Infinity;
  sortedEvents.forEach(evt => {
    const evtDate = new Date(evt.date);
    evtDate.setHours(0, 0, 0, 0);
    const diff = evtDate - today;
    if (diff >= 0 && diff < minDiff) {
      minDiff = diff;
      closestFutureEventId = evt.id;
    }
  });

  // If no future event, focus the last past event
  if (!closestFutureEventId && sortedEvents.length > 0) {
    closestFutureEventId = sortedEvents[sortedEvents.length - 1].id;
  }

  sortedEvents.forEach((evt) => {
    const d = new Date(evt.date);
    const monthYear = d.toLocaleDateString("tr-TR", { month: "long", year: "numeric" }).toUpperCase();
    
    if (monthYear !== currentGroup) {
      groupedEvents.push({ type: "marker", label: monthYear, id: `marker-${monthYear}` });
      currentGroup = monthYear;
    }
    
    groupedEvents.push({ type: "event", data: evt });
  });

  const isVideo = (url) => url && (url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".ogg"));
  const waNumber = "905305012458";

  if (sortedEvents.length === 0) {
    return (
      <div className={styles.emptyTimeline}>
        <p>Henüz etkinlik bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className={styles.timelineWrapper}>
      {/* The golden line */}
      <div className={styles.timelineLine}></div>
      
      <div className={styles.scrollContainer} ref={containerRef}>
        <div className={styles.timelineTrack}>
          {groupedEvents.map((item, index) => {
            if (item.type === "marker") {
              return (
                <div key={item.id} className={styles.markerContainer}>
                  <div className={styles.markerDot}></div>
                  <h3 className={styles.markerLabel}>{item.label}</h3>
                </div>
              );
            }

            const evt = item.data;
            const evtDate = new Date(evt.date);
            evtDate.setHours(0,0,0,0);
            const isPast = evtDate < today;
            const isToday = evt.id === closestFutureEventId;
            const mediaUrl = evt.posterUrl || evt.artist?.photoUrl;

            return (
              <div 
                key={evt.id} 
                className={`${styles.eventCard} ${isPast ? styles.pastEvent : ""}`}
                ref={isToday ? todayRef : null}
                onMouseEnter={() => setHoveredEvent(evt.id)}
                onMouseLeave={() => setHoveredEvent(null)}
              >
                <div className={styles.cardDot}></div>
                
                <div className={styles.mediaContainer}>
                  {isVideo(mediaUrl) ? (
                    <video 
                      className={styles.eventVideo}
                      data-id={evt.id}
                      src={mediaUrl} 
                      muted={false} // User requested sound
                      loop 
                      playsInline
                      preload="metadata"
                      poster={mediaUrl.replace('.mp4', '.jpg')} // Fallback if available
                    />
                  ) : (
                    <img 
                      src={mediaUrl || "/assets/images/bdf870_a1401b7cf6044c358c19292fdea2a50cf000.jpg"} 
                      alt={evt.title} 
                      className={styles.eventImg} 
                    />
                  )}
                  
                  {isPast && <div className={styles.pastOverlay}>GEÇMİŞ ETKİNLİK</div>}
                </div>

                <div className={styles.eventInfo}>
                  <p className={styles.eventDate}>
                    {new Date(evt.date).toLocaleDateString("tr-TR", {
                      day: "numeric", month: "long", weekday: "long"
                    })}
                  </p>
                  <h4 className={styles.eventTitle}>{evt.artist?.name || evt.title}</h4>
                  
                  {!isPast && (
                    <button
                      onClick={() => {
                        const dateStr = new Date(evt.date).toISOString().split("T")[0]; // YYYY-MM-DD
                        const artistName = evt.artist?.name || evt.title;
                        const noteText = `${artistName} gecesi için rezervasyon yaptırmak istiyorum.`;
                        
                        // Dispatch custom event to the form
                        window.dispatchEvent(new CustomEvent('fillReservation', {
                          detail: { date: dateStr, notes: noteText }
                        }));
                        
                        // Scroll to form
                        document.getElementById("rezervasyon")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={styles.reserveBtn}
                    >
                      Rezervasyon
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
