import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Waves } from 'lucide-react';

// Images de pêcheurs sénégalais
const SLIDES = [
  {
    image: 'https://i.pinimg.com/736x/ae/19/51/ae19510120cbb67b086df77dea2e170e.jpg'
  },
  {
    image: 'https://i.pinimg.com/1200x/4c/12/a8/4c12a86f3b74e807c3ce999653e5e39e.jpg'
  },
  {
    image: 'https://i.pinimg.com/1200x/2f/11/a7/2f11a76af1e91323208ff785b2140d83.jpg'
  },
  {
    image: 'https://i.pinimg.com/736x/25/56/9b/25569bf1becb4a347c0e490aaa301e99.jpg'
  },
  {
    image: 'https://i.pinimg.com/736x/f3/7e/e0/f37ee0edeb9e29cbfa8cfb04924fbd75.jpg'
  },
  {
    image: 'https://i.pinimg.com/1200x/19/94/12/199412425208b6fed7e1f43117c75876.jpg'
  },
];

const FALLBACK_IMAGE =
  'https://i.pinimg.com/736x/ae/19/51/ae19510120cbb67b086df77dea2e170e.jpg';

export default function PecheurHeroCarousel() {
  const [index, setIndex] = useState(0);

  // Auto-défilement toutes les 5 s
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const aller = (dir) => {
    setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length);
  };

  return (
    <div className="relative h-56 w-full overflow-hidden rounded-b-[40px] bg-slate-900 shadow-xl">
      {/* Slides */}
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={slide.image}
            alt={slide.titre}
            className="h-full w-full object-cover"
            loading={i === 0 ? 'eager' : 'lazy'}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = FALLBACK_IMAGE;
            }}
          />
          {/* Voile dégradé pour lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0C3B4A] via-[#0C3B4A]/40 to-transparent" />
          {/* Léger voile sépia pour ambiance sénégalaise */}
          <div className="absolute inset-0 bg-amber-900/10 mix-blend-multiply" />
        </div>
      ))}

      {/* Vague de transition bas vers le fond crème */}
      <svg
        viewBox="0 0 400 40"
        preserveAspectRatio="none"
        className="absolute -bottom-1 left-0 right-0 z-20 block h-8 w-full text-[#F7F4EF]"
      >
        <path
          d="M0,40 L0,20 C 60,4 110,4 160,20 C 210,36 260,36 310,20 C 350,8 380,8 400,20 L400,40 Z"
          fill="currentColor"
        />
      </svg>

      {/* Flèches */}
      <button
        onClick={() => aller(-1)}
        aria-label="Image précédente"
        className="absolute left-3 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={() => aller(1)}
        aria-label="Image suivante"
        className="absolute right-3 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50"
      >
        <ChevronRight size={18} />
      </button>

    

      {/* Points de pagination */}
      <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? 'w-6 bg-amber-400' : 'w-1.5 bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}