import * as React from "react"
import { cn } from "../../lib/utils"

const Field = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("space-y-2", className)}
      {...props}
    />
  )
})
Field.displayName = "Field"

const FieldGroup = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("space-y-4", className)}
      {...props}
    />
  )
})
FieldGroup.displayName = "FieldGroup"

const FieldLabel = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
})
FieldLabel.displayName = "FieldLabel"

const FieldDescription = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FieldDescription.displayName = "FieldDescription"

const FieldError = React.forwardRef(({ className, errors, ...props }, ref) => {
  if (!errors || errors.length === 0) return null

  return (
    <p
      ref={ref}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {errors.map((error, index) => (
        <span key={index}>
          {error.message}
          {index < errors.length - 1 && <br />}
        </span>
      ))}
    </p>
  )
})
FieldError.displayName = "FieldError"

export {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
}
