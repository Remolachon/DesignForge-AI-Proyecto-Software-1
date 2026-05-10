'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import { FileAsset } from '@/types/product';
import { ChevronLeft, ChevronRight, Video, ImageIcon, Play, Pause } from 'lucide-react';

interface ProductCarouselProps {
    media: FileAsset[];
    altText: string;
}

const InteractiveImage = ({ src, alt }: { src: string; alt: string }) => {
    const [isZoomed, setIsZoomed] = useState(false);
    const [position, setPosition] = useState({ x: 50, y: 50 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isZoomed) return;
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setPosition({ x, y });
    };

    return (
        <div 
            className={`relative w-full h-full overflow-hidden transition-all duration-300 ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => { setIsZoomed(false); setPosition({ x: 50, y: 50 }); }}
            onMouseMove={handleMouseMove}
            onClick={() => setIsZoomed(!isZoomed)}
        >
            <Image
                src={src}
                alt={alt}
                fill
                className={`object-cover transition-transform duration-200 ease-out ${isZoomed ? 'scale-[2.5]' : 'scale-100'}`}
                style={{ transformOrigin: `${position.x}% ${position.y}%` }}
                unoptimized
            />
        </div>
    );
};

const InteractiveVideo = ({ src }: { src: string }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="relative w-full h-full cursor-pointer group/video" onClick={togglePlay}>
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
            />
            <div className={`absolute inset-0 flex items-center justify-center bg-black/10 transition-opacity duration-300 ${isPlaying ? 'opacity-0 group-hover/video:opacity-100' : 'opacity-100 bg-black/30'}`}>
                {isPlaying ? (
                    <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-lg transform transition-transform hover:scale-110">
                        <Pause className="w-6 h-6 fill-current" />
                    </div>
                ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/80 backdrop-blur-md flex items-center justify-center text-primary-foreground border border-white/20 shadow-lg transform transition-transform hover:scale-110">
                        <Play className="w-7 h-7 fill-current ml-1" />
                    </div>
                )}
            </div>
        </div>
    );
};

export const ProductCarousel: React.FC<ProductCarouselProps> = ({ media, altText }) => {
    // Sort media based on sort_order and main role
    const sortedMedia = [...media].sort((a, b) => {
        if (a.media_role === 'main') return -1;
        if (b.media_role === 'main') return 1;
        return (a.sort_order || 0) - (b.sort_order || 0);
    });

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mainRef, emblaMainApi] = useEmblaCarousel({ loop: true });
    const [thumbRef, emblaThumbApi] = useEmblaCarousel({
        containScroll: 'keepSnaps',
        dragFree: true,
    });

    const onThumbClick = useCallback(
        (index: number) => {
            if (!emblaMainApi || !emblaThumbApi) return;
            emblaMainApi.scrollTo(index);
        },
        [emblaMainApi, emblaThumbApi]
    );

    const onSelect = useCallback(() => {
        if (!emblaMainApi || !emblaThumbApi) return;
        const selected = emblaMainApi.selectedScrollSnap();
        setSelectedIndex(selected);
        emblaThumbApi.scrollTo(selected);
    }, [emblaMainApi, emblaThumbApi]);

    useEffect(() => {
        if (!emblaMainApi) return;
        onSelect();
        emblaMainApi.on('select', onSelect);
        emblaMainApi.on('reInit', onSelect);
        return () => {
            emblaMainApi.off('select', onSelect);
            emblaMainApi.off('reInit', onSelect);
        };
    }, [emblaMainApi, onSelect]);

    const scrollPrev = useCallback(() => emblaMainApi && emblaMainApi.scrollPrev(), [emblaMainApi]);
    const scrollNext = useCallback(() => emblaMainApi && emblaMainApi.scrollNext(), [emblaMainApi]);

    if (!sortedMedia || sortedMedia.length === 0) {
        return (
            <div className="w-full aspect-[4/5] bg-muted/30 rounded-2xl flex items-center justify-center border border-border/40">
                <span className="text-muted-foreground">Sin imagen</span>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col md:flex-row-reverse gap-4 lg:gap-6">
            {/* Main Carousel */}
            <div className="relative flex-1 bg-muted/30 rounded-2xl overflow-hidden aspect-[4/5] border border-border/40 shadow-sm group">
                <div className="overflow-hidden w-full h-full" ref={mainRef}>
                    <div className="flex w-full h-full touch-pan-y">
                        {sortedMedia.map((item, index) => (
                            <div key={item.id || index} className="flex-[0_0_100%] min-w-0 relative h-full">
                                {item.media_kind === 'video' ? (
                                    <InteractiveVideo src={item.storage_path} />
                                ) : (
                                    <InteractiveImage src={item.storage_path} alt={`${altText} - Imagen ${index + 1}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation Buttons (Desktop only, mobile can swipe) */}
                {sortedMedia.length > 1 && (
                    <>
                        <button
                            onClick={scrollPrev}
                            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-background/60 hover:bg-background/90 text-foreground rounded-full shadow-lg backdrop-blur-md border border-border/50 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-110 z-10"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={scrollNext}
                            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-background/60 hover:bg-background/90 text-foreground rounded-full shadow-lg backdrop-blur-md border border-border/50 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-110 z-10"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </>
                )}
            </div>

            {/* Thumbnails */}
            {sortedMedia.length > 1 && (
                <div className="md:w-24 w-full h-full flex flex-col justify-start">
                    <div className="overflow-hidden w-full" ref={thumbRef}>
                        <div className="flex md:flex-col flex-row gap-3">
                            {sortedMedia.map((item, index) => (
                                <button
                                    key={item.id || index}
                                    onClick={() => onThumbClick(index)}
                                    className={`relative flex-[0_0_80px] md:flex-[0_0_96px] w-20 h-24 md:w-full md:h-28 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                                        index === selectedIndex
                                            ? 'border-primary opacity-100 shadow-md scale-[1.02] ring-2 ring-primary/20 ring-offset-1 ring-offset-background'
                                            : 'border-transparent opacity-60 hover:opacity-100 bg-muted/30 hover:scale-[1.02]'
                                    }`}
                                >
                                    {item.media_kind === 'video' ? (
                                        <>
                                            <video
                                                src={item.storage_path}
                                                className="w-full h-full object-cover"
                                                muted
                                                playsInline
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                                                <Video className="w-6 h-6 text-white drop-shadow-md" />
                                            </div>
                                        </>
                                    ) : (
                                        <Image
                                            src={item.storage_path}
                                            alt={`Thumbnail ${index + 1}`}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
