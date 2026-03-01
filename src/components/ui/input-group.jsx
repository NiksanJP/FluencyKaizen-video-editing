import * as React from "react"
import { cn } from "../../lib/utils"

const InputGroup = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("relative flex w-full items-center", className)}
      {...props}
    />
  )
})
InputGroup.displayName = "InputGroup"

const InputGroupText = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        "flex items-center justify-center whitespace-nowrap border border-input bg-background px-3 text-sm text-muted-foreground",
        "first:rounded-l-md last:rounded-r-md first:border-r-0 last:border-l-0",
        className
      )}
      {...props}
    />
  )
})
InputGroupText.displayName = "InputGroupText"

const InputGroupAddon = React.forwardRef(({ className, align = "start", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center",
        align === "start" && "justify-start",
        align === "end" && "justify-end",
        align === "center" && "justify-center",
        align === "block-start" && "items-start",
        align === "block-end" && "items-end",
        className
      )}
      {...props}
    />
  )
})
InputGroupAddon.displayName = "InputGroupAddon"

const InputGroupTextarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
})
InputGroupTextarea.displayName = "InputGroupTextarea"

export {
  InputGroup,
  InputGroupText,
  InputGroupAddon,
  InputGroupTextarea,
}
