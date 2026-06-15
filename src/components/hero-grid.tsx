"use client";

import { useEffect, useRef } from "react";

const COLS = [
  {
    offset: 0,
    images: [
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=500&q=80",
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&q=80",
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=500&q=80",
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80",
    ],
  },
  {
    offset: 32,
    images: [
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500&q=80",
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=500&q=80",
      "https://images.unsplash.com/photo-1549451371-64aa98a6f660?w=500&q=80",
      "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=500&q=80",
    ],
  },
  {
    offset: 16,
    images: [
      "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=500&q=80",
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500&q=80",
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&q=80",
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=500&q=80",
    ],
  },
  {
    offset: 48,
    images: [
      "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=500&q=80",
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&q=80",
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=500&q=80",
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&q=80",
    ],
  },
  {
    offset: 24,
    images: [
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&q=80",
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&q=80",
      "https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=500&q=80",
      "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=500&q=80",
    ],
  },
];

export function HeroGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const isMobileRef = useRef(false);

  useEffect(() => {
    isMobileRef.current = window.innerWidth < 768;

    const el = ref.current;
    if (!el) return;

    const handleScroll = () => {
      const cols = isMobileRef.current ? 3 : 5;
      const scale = isMobileRef.current ? 1.6 : 1.4;
      const y = window.scrollY;
      el.style.transform = `rotate(-12deg) scale(${scale}) translateY(${y * 0.25}px)`;
      void cols;
    };

    const handleResize = () => {
      isMobileRef.current = window.innerWidth < 768;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      ref={ref}
      style={{
        transform: "rotate(-12deg) scale(1.4)",
        transformOrigin: "center center",
        willChange: "transform",
      }}
    >
      {/* Desktop: 5 cols */}
      <div className="hidden md:grid md:grid-cols-5 md:gap-3" style={{ width: "140%" }}>
        {COLS.map((col, ci) => (
          <div className="flex flex-col gap-3" key={ci} style={{ paddingTop: col.offset }}>
            {col.images.map((src, i) => (
              <div
                className="overflow-hidden rounded-2xl"
                key={i}
                style={{ aspectRatio: i % 2 === 0 ? "3/4" : "1/1" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" className="size-full object-cover" src={src} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Mobile: 3 cols, tighter stagger */}
      <div className="grid grid-cols-3 gap-2 md:hidden" style={{ width: "160%" }}>
        {COLS.slice(0, 3).map((col, ci) => (
          <div
            className="flex flex-col gap-2"
            key={ci}
            style={{ paddingTop: [0, 20, 10][ci] }}
          >
            {col.images.map((src, i) => (
              <div
                className="overflow-hidden rounded-xl"
                key={i}
                style={{ aspectRatio: i % 2 === 0 ? "3/4" : "1/1" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" className="size-full object-cover" src={src} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
