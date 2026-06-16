'use client';

type Slide = {
  id: string;
  image: string;
  title: string;
  subtitle: string;
};

type SectionCarouselProps = {
  slides: Slide[];
};

export default function SectionCarousel({ slides }: SectionCarouselProps) {
  if (!slides?.length) return null;
  const list = slides.filter(Boolean);

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5">
      <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${0 * 100}%)` }}>
        {list.map((slide) => (
          <div key={slide.id} className="w-full flex-shrink-0">
            <div className="relative h-48 w-full">
              {slide.image && <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />}
              <div className="absolute inset-0 bg-black/50" />
              <div className="absolute inset-0 flex flex-col justify-end p-5">
                <h3 className="text-lg font-bold text-white">{slide.title}</h3>
                {slide.subtitle && <p className="text-sm text-gray-300">{slide.subtitle}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-3 right-4 flex gap-2">
        <button className="h-8 w-8 rounded-full bg-white/10 text-xs hover:bg-white/20">←</button>
        <button className="h-8 w-8 rounded-full bg-white/10 text-xs hover:bg-white/20">→</button>
      </div>
    </div>
  );
}
