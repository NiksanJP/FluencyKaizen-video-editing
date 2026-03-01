import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "../../lib/utils"

const ScrollArea = React.forwardRef(
  (
    {
      className,
      viewportClassName,
      viewportProps = {},
      children,
      scrollbars = "vertical",
      ...props
    },
    forwardedRef
  ) => {
    const viewportRef = React.useRef(null)

    React.useImperativeHandle(forwardedRef, () => viewportRef.current)

    const showVertical = scrollbars === "vertical" || scrollbars === "both"
    const showHorizontal = scrollbars === "horizontal" || scrollbars === "both"

    return (
      <ScrollAreaPrimitive.Root
        className={cn("relative overflow-hidden", className)}
        {...props}>
        <ScrollAreaPrimitive.Viewport
          ref={viewportRef}
          className={cn("h-full w-full max-w-full min-w-0 rounded-[inherit] [&>div]:!min-w-0 [&>div]:!block", viewportClassName)}
          {...viewportProps}>
          {children}
        </ScrollAreaPrimitive.Viewport>
        {showVertical ? <ScrollBar orientation="vertical" /> : null}
        {showHorizontal ? <ScrollBar orientation="horizontal" /> : null}
        {showVertical && showHorizontal ? <ScrollAreaPrimitive.Corner /> : null}
      </ScrollAreaPrimitive.Root>
    )
  }
)
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}>
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
