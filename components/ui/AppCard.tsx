import React from 'react';
import { cn } from '../../lib/utils';

interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'glass' | 'flat';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const AppCard = React.forwardRef<HTMLDivElement, AppCardProps>(
    ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {

        const variants = {
            default: "bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300",
            outline: "bg-transparent border border-slate-200 border-dashed",
            ghost: "bg-slate-50 border-none",
            flat: "bg-white border border-slate-100 shadow-none",
            glass: "bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl supports-[backdrop-filter]:bg-white/60", // Apple Style
        };

        const paddings = {
            none: "p-0",
            sm: "p-3",
            md: "p-5",
            lg: "p-8",
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "rounded-2xl overflow-hidden", // Curvatura Apple
                    variants[variant],
                    paddings[padding],
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);
AppCard.displayName = "AppCard";
