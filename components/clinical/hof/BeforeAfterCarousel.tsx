import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Camera, X } from 'lucide-react';
import { cn } from "../../../src/lib/utils";

// Mock Data Types
interface Comparison {
    id: string;
    dateBefore: string;
    dateAfter: string;
    imgBefore: string;
    imgAfter: string;
    procedure: string;
}

export const BeforeAfterCarousel: React.FC = () => {
    // Mock State - In real app, fetch from DB
    const [comparisons, setComparisons] = useState<Comparison[]>([
        {
            id: '1',
            dateBefore: '2023-10-01',
            dateAfter: '2023-10-15',
            imgBefore: 'https://images.unsplash.com/photo-1519699047748-40ba5267930b?q=80&w=1000&auto=format&fit=crop', // Generic face
            imgAfter: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=1000&auto=format&fit=crop', // "Better" face
            procedure: 'Preenchimento Labial'
        }
    ]);

    const [activeIndex, setActiveIndex] = useState(0);
    const [sliderPosition, setSliderPosition] = useState(50);

    const handleSlide = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        const container = e.currentTarget.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const position = ((clientX - container.left) / container.width) * 100;
        setSliderPosition(Math.min(100, Math.max(0, position)));
    };

    if (comparisons.length === 0) {
        return (
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-8 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 min-h-[300px] flex flex-col items-center justify-center group cursor-pointer hover:border-pink-400 transition-colors">
                <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-400 group-hover:text-pink-500 transition-colors shadow-sm">
                    <Camera size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Galeria Vazia</h3>
                <p className="text-sm text-slate-500 mb-6 max-w-xs">Adicione fotos de "Antes e Depois" para documentar a evolução estética.</p>
                <button className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-pink-200 dark:shadow-none transition-all">
                    Adicionar Comparação
                </button>
            </div>
        );
    }

    const current = comparisons[activeIndex];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        Galeria Antes & Depois
                        <span className="text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            {activeIndex + 1} / {comparisons.length}
                        </span>
                    </h3>
                    <p className="text-xs text-pink-600 font-bold uppercase tracking-wider mt-0.5">{current.procedure}</p>
                </div>
                <button className="text-sm text-pink-600 font-bold hover:bg-pink-50 dark:hover:bg-pink-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                    <Plus size={16} /> Nova
                </button>
            </div>

            {/* Interactive Slider Area */}
            <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden select-none" onMouseMove={handleSlide} onTouchMove={handleSlide}>
                {/* Image After (Background) */}
                <img src={current.imgAfter} alt="Depois" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute top-4 right-4 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm">
                    DEPOIS ({new Date(current.dateAfter).toLocaleDateString()})
                </div>

                {/* Image Before (Foreground, Clipped) */}
                <div
                    className="absolute inset-0 w-full h-full overflow-hidden border-r-2 border-white/80 shadow-2xl"
                    style={{ width: `${sliderPosition}% ` }}
                >
                    <img src={current.imgBefore} alt="Antes" className="absolute inset-0 w-full h-full object-cover max-w-none" style={{ width: '100vw' /* fix aspect to match container width effectively in clipper? No, object-cover handles this usually if container is same size. Actually we need container width. For now simple object-cover. */ }} />
                    {/* FIX: object-cover works if image is same size. If not, we need fixed dimensions. */}
                </div>

                <div className="absolute top-4 left-4 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm z-10">
                    ANTES ({new Date(current.dateBefore).toLocaleDateString()})
                </div>

                {/* Slider Handle */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize z-20 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)]" style={{ left: `${sliderPosition}% ` }}>
                    <div className="w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                        <div className="flex gap-0.5">
                            <ChevronLeft size={12} className="text-slate-400" />
                            <ChevronRight size={12} className="text-slate-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Thumbnails / Navigation */}
            {comparisons.length > 1 && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950/50 flex gap-2 overflow-x-auto">
                    {comparisons.map((c, idx) => (
                        <button
                            key={c.id}
                            onClick={() => setActiveIndex(idx)}
                            className={cn(
                                "w-16 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0",
                                activeIndex === idx ? "border-pink-500 opacity-100" : "border-transparent opacity-50 hover:opacity-80"
                            )}
                        >
                            <img src={c.imgAfter} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
