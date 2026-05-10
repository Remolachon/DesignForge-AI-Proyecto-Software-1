'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Image as ImageIcon, Video, Star, GripVertical, UploadCloud } from 'lucide-react';
import { MediaUploadItem } from '@/components/marketplace/types/marketplace.types';
import Image from 'next/image';

interface MediaUploaderProps {
    items: MediaUploadItem[];
    onChange: (items: MediaUploadItem[]) => void;
    error?: string;
}

const SortableMediaItem = ({
    item,
    onRemove,
    onSetMain,
}: {
    item: MediaUploadItem;
    onRemove: (id: string) => void;
    onSetMain: (id: string) => void;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative flex flex-col md:flex-row items-center gap-3 p-3 bg-white border rounded-xl shadow-sm group ${
                isDragging ? 'shadow-md ring-2 ring-primary/50 opacity-90' : 'border-border'
            }`}
        >
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-2 text-muted-foreground hover:text-foreground transition-colors touch-none"
            >
                <GripVertical className="w-5 h-5" />
            </div>

            <div className="relative w-full md:w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {item.media_kind === 'image' ? (
                    <Image
                        src={item.previewUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                    />
                ) : (
                    <video
                        src={item.previewUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                    />
                )}
                {item.media_role === 'main' && (
                    <div className="absolute top-1 left-1 bg-yellow-500 text-white p-1 rounded-full shadow-sm">
                        <Star className="w-3 h-3 fill-current" />
                    </div>
                )}
                <div className="absolute bottom-1 right-1 bg-black/60 text-white p-1 rounded-md backdrop-blur-sm">
                    {item.media_kind === 'image' ? (
                        <ImageIcon className="w-3 h-3" />
                    ) : (
                        <Video className="w-3 h-3" />
                    )}
                </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-sm font-medium truncate text-foreground">
                    {item.file?.name || 'Archivo existente'}
                </p>
                <p className="text-xs text-muted-foreground">
                    {item.file ? `${(item.file.size / 1024 / 1024).toFixed(2)} MB` : 'Ya subido'}
                </p>
            </div>

            <div className="flex items-center gap-2 mt-2 md:mt-0">
                {item.media_role !== 'main' && (
                    <button
                        type="button"
                        onClick={() => onSetMain(item.id)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                        Hacer principal
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export const MediaUploader: React.FC<MediaUploaderProps> = ({ items, onChange, error }) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Cleanup object URLs to avoid memory leaks
    useEffect(() => {
        return () => {
            items.forEach((item) => {
                if (item.previewUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(item.previewUrl);
                }
            });
        };
    }, []); // Note: not doing it on every items change to avoid revoking currently used ones until unmount, or we could track removed ones.

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const newItems: MediaUploadItem[] = acceptedFiles.map((file) => {
                const isVideo = file.type.startsWith('video/');
                return {
                    id: Math.random().toString(36).substring(2, 9),
                    file,
                    previewUrl: URL.createObjectURL(file),
                    media_kind: isVideo ? 'video' : 'image',
                    media_role: 'gallery',
                };
            });

            const nextItems = [...items, ...newItems];
            
            // Automatically set first item as main if none is set
            if (nextItems.length > 0 && !nextItems.some((i) => i.media_role === 'main')) {
                nextItems[0].media_role = 'main';
            }

            onChange(nextItems);
        },
        [items, onChange]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': [],
            'image/png': [],
            'image/webp': [],
            'image/avif': [],
            'video/mp4': [],
            'video/webm': [],
        },
        maxSize: 50 * 1024 * 1024, // 50MB
    });

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            onChange(arrayMove(items, oldIndex, newIndex));
        }
    };

    const handleRemove = (id: string) => {
        const itemToRemove = items.find((i) => i.id === id);
        if (itemToRemove && itemToRemove.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(itemToRemove.previewUrl);
        }

        const filtered = items.filter((item) => item.id !== id);
        
        // If we removed the main item, set the first available item as main
        if (itemToRemove?.media_role === 'main' && filtered.length > 0) {
            filtered[0].media_role = 'main';
        }

        onChange(filtered);
    };

    const handleSetMain = (id: string) => {
        const updated = items.map((item) => ({
            ...item,
            media_role: (item.id === id ? 'main' : 'gallery') as 'main' | 'gallery',
        }));
        // Sort main to top automatically? Optional, let's keep user's manual sorting
        onChange(updated);
    };

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                        ? 'border-primary bg-primary/5'
                        : error
                        ? 'border-red-300 bg-red-50/50 hover:bg-red-50'
                        : 'border-border hover:bg-muted/50'
                }`}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-3">
                    <div className={`p-4 rounded-full ${isDragActive ? 'bg-primary/10' : 'bg-muted'}`}>
                        <UploadCloud className={`w-8 h-8 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            Arrastra archivos aquí, o haz clic para seleccionar
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Soporta imágenes (JPG, PNG, WEBP) hasta 10MB y videos (MP4, WEBM) hasta 50MB
                        </p>
                    </div>
                </div>
            </div>

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

            {items.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground flex items-center justify-between">
                        Archivos seleccionados ({items.length})
                        <span className="text-xs font-normal text-muted-foreground">
                            Arrastra para ordenar
                        </span>
                    </p>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-2">
                                {items.map((item) => (
                                    <SortableMediaItem
                                        key={item.id}
                                        item={item}
                                        onRemove={handleRemove}
                                        onSetMain={handleSetMain}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            )}
        </div>
    );
};
