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
  const list = (slides || []).filter((s) => s && (s.image || s.title || s.subtitle));
  const [index, setIndex] = React.useState(0);

  if (!list.length) return null;

  const go = (dir: number) => {
    setIndex((prev) => {
      const next = prev + dir;
      if (next < 0) return list.length - 1;
      if (next >= list.length) return 0;
      return next;
    });
  };

  const current = list[index];

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5">
      <div className="relative h-48 w-full">
        {current.image && <img src={current.image} alt={current.title} className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex flex-col justify-end p-5">
          <h3 className="text-lg font-bold text-white">{current.title}</h3>
          {current.subtitle && <p className="text-sm text-gray-300">{current.subtitle}</p>}
        </div>
      </div>
      <div className="absolute bottom-3 right-4 flex gap-2">
        <button type="button" onClick={() => go(-1)} className="h-8 w-8 rounded-full bg-white/10 text-xs hover:bg-white/20">←</button>
        <button type="button" onClick={() => go(1)} className="h-8 w-8 rounded-full bg-white/10 text-xs hover:bg-white/20">→</button>
      </div>
      <div className="absolute bottom-3 left-4 flex gap-1">
        {list.map((_, i) => (
          <span key={i} className={`h-2 w-2 rounded-full ${i === index ? 'bg-amber-400' : 'bg-white/30'}`} />
        ))}
      </div>
    </div>
  );
}
