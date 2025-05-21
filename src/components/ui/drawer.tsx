import * as React from "react"
import { cn } from "../../lib/utils"

interface DrawerProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
}

const Drawer = React.forwardRef<HTMLDivElement, DrawerProps>(
  ({ className, isOpen, onClose, children, ...props }, ref) => {
    if (!isOpen) return null;

    return (
      <>
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
        <div
          ref={ref}
          className={cn(
            "fixed right-0 top-0 h-full w-[400px] bg-white shadow-lg z-50 transform transition-transform duration-200 ease-in-out",
            isOpen ? "translate-x-0" : "translate-x-full",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </>
    )
  }
)
Drawer.displayName = "Drawer"

const DrawerHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-between p-4 border-b", className)}
    {...props}
  />
))
DrawerHeader.displayName = "DrawerHeader"

const DrawerContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-4 overflow-y-auto h-[calc(100%-64px)]", className)}
    {...props}
  />
))
DrawerContent.displayName = "DrawerContent"

export { Drawer, DrawerHeader, DrawerContent } 