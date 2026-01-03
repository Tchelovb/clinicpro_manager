import * as React from "react"
import { Drawer as Vaul } from "vaul"
import { cn } from "../../src/lib/utils"

const Drawer = ({
    shouldScaleBackground = true,
    ...props
}: React.ComponentProps<typeof Vaul.Root>) => (
    <Vaul.Root shouldScaleBackground={shouldScaleBackground} {...props} />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = Vaul.Trigger

const DrawerPortal = Vaul.Portal

const DrawerClose = Vaul.Close

const DrawerOverlay = React.forwardRef<
    React.ElementRef<typeof Vaul.Overlay>,
    React.ComponentPropsWithoutRef<typeof Vaul.Overlay>
>(({ className, ...props }, ref) => (
    <Vaul.Overlay
        ref={ref}
        className={cn("fixed inset-0 z-50 bg-black/40 backdrop-blur-sm", className)}
        {...props}
    />
))
DrawerOverlay.displayName = Vaul.Overlay.displayName

const DrawerContent = React.forwardRef<
    React.ElementRef<typeof Vaul.Content>,
    React.ComponentPropsWithoutRef<typeof Vaul.Content>
>(({ className, children, ...props }, ref) => (
    <DrawerPortal>
        <DrawerOverlay />
        <Vaul.Content
            ref={ref}
            className={cn(
                "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border border-slate-200 bg-white outline-none dark:border-slate-800 dark:bg-slate-950",
                className
            )}
            {...props}
        >
            <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-slate-100 dark:bg-slate-800" />
            {children}
        </Vaul.Content>
    </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
        {...props}
    />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn("mt-auto flex flex-col gap-2 p-4", className)}
        {...props}
    />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
    React.ElementRef<typeof Vaul.Title>,
    React.ComponentPropsWithoutRef<typeof Vaul.Title>
>(({ className, ...props }, ref) => (
    <Vaul.Title
        ref={ref}
        className={cn(
            "text-lg font-semibold leading-none tracking-tight",
            className
        )}
        {...props}
    />
))
DrawerTitle.displayName = Vaul.Title.displayName

const DrawerDescription = React.forwardRef<
    React.ElementRef<typeof Vaul.Description>,
    React.ComponentPropsWithoutRef<typeof Vaul.Description>
>(({ className, ...props }, ref) => (
    <Vaul.Description
        ref={ref}
        className={cn("text-sm text-slate-500 dark:text-slate-400", className)}
        {...props}
    />
))
DrawerDescription.displayName = Vaul.Description.displayName

export {
    Drawer,
    DrawerPortal,
    DrawerOverlay,
    DrawerTrigger,
    DrawerClose,
    DrawerContent,
    DrawerHeader,
    DrawerFooter,
    DrawerTitle,
    DrawerDescription,
}
