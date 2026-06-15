"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function GSAPAnimations({ children }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    // Animate elements with a musical bounce effect
    const animateElements = document.querySelectorAll("[data-animate='true']");
    animateElements.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 40, scale: 0.98 },
        {
          scrollTrigger: {
            trigger: el,
            start: "top 90%", // Trigger slightly earlier
            toggleActions: "play none none reverse",
          },
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.5)", // Back ease gives a subtle, premium bounce
        }
      );
    });

    // Parallax effect for background elements
    const parallaxElements = document.querySelectorAll("[data-parallax='true']");
    parallaxElements.forEach((el) => {
      gsap.fromTo(
        el,
        { yPercent: -15 },
        {
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
          yPercent: 15,
          ease: "none",
        }
      );
    });

    // Refresh ScrollTrigger after images load to fix positioning issues
    const handleLoad = () => {
      ScrollTrigger.refresh();
    };

    window.addEventListener("load", handleLoad);
    
    // Also force a refresh after a slight delay for dynamically loaded fonts/images
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 1000);

    return () => {
      window.removeEventListener("load", handleLoad);
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return <>{children}</>;
}
