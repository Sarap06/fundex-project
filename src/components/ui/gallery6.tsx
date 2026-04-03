'use client';

import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import type { CarouselApi } from '@/components/ui/carousel';

interface GalleryItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  image: string;
}

interface Gallery6Props {
  heading?: string;
  demoUrl?: string;
  items?: GalleryItem[];
}

const Gallery6 = ({
  heading = 'Gallery',
  demoUrl = '#',
  items = [],
}: Gallery6Props) => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!carouselApi) return;
    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    };
    updateSelection();
    carouselApi.on('select', updateSelection);
    return () => {
      carouselApi.off('select', updateSelection);
    };
  }, [carouselApi]);

  return (
    <section className="py-16">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="mb-8 flex flex-col justify-between md:mb-14 md:flex-row md:items-end lg:mb-16">
          <div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-foreground uppercase tracking-tight mb-4">
              {heading}
            </h2>
            <a
              href={demoUrl}
              className="group mt-4 flex items-center gap-1 font-sans text-sm font-semibold"
              style={{ color: 'var(--primary)' }}
            >
              Book a demo
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
          <div className="mt-8 flex shrink-0 items-center justify-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => carouselApi?.scrollPrev()}
              disabled={!canScrollPrev}
              className="disabled:pointer-events-auto rounded-full"
            >
              <ArrowLeft className="size-5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => carouselApi?.scrollNext()}
              disabled={!canScrollNext}
              className="disabled:pointer-events-auto rounded-full"
            >
              <ArrowRight className="size-5" />
            </Button>
          </div>
        </div>
      </div>
      <div className="w-full">
        <Carousel
          setApi={setCarouselApi}
          opts={{ breakpoints: { '(max-width: 768px)': { dragFree: true } } }}
        >
          <CarouselContent className="ml-[calc(theme(container.padding)-20px)] mr-[calc(theme(container.padding))] 2xl:ml-[calc(50vw-700px+theme(container.padding)-20px)]">
            {items.map((item) => (
              <CarouselItem key={item.id} className="pl-[20px] md:max-w-[452px]">
                <a href={item.url} className="group flex flex-col justify-between">
                  <div>
                    <div className="flex aspect-[3/2] overflow-clip rounded-xl border border-border">
                      <div className="flex-1 transition-all duration-300 group-hover:scale-105">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="mb-2 mt-6 line-clamp-3 break-words font-display text-lg font-display font-bold text-foreground">
                      {item.title}
                    </div>
                    <div className="mb-4 line-clamp-2 font-sans text-sm text-muted-foreground">
                      {item.summary}
                    </div>
                  </div>
                  <div
                    className="flex items-center font-sans text-sm font-semibold"
                    style={{ color: 'var(--primary)' }}
                  >
                    Read more <ArrowUpRight className="ml-2 size-4" />
                  </div>
                </a>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
};

export { Gallery6 };
