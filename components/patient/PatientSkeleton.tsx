import React from 'react';

export const PatientSkeleton = () => (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 animate-in fade-in duration-500">
        {/* Header Skeleton */}
        <div className="flex-none p-6 bg-card border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
                <div className="space-y-3 flex-1">
                    <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="flex gap-2">
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                </div>
            </div>
            {/* Stats Skeleton */}
            <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-lg animate-pulse border border-slate-200 dark:border-slate-800" />
                ))}
            </div>
        </div>
        {/* Body Skeleton */}
        <div className="flex-1 p-6 space-y-6 overflow-hidden">
            <div className="h-48 bg-card rounded-xl animate-pulse border border-slate-200 dark:border-slate-800 shadow-sm" />
            <div className="h-48 bg-card rounded-xl animate-pulse border border-slate-200 dark:border-slate-800 shadow-sm" />
        </div>
    </div>
);
