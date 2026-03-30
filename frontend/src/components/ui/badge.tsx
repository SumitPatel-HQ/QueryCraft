"use client";

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.15)] bg-transparent px-2 py-1 text-[12px] font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-white focus-visible:ring-white/50 focus-visible:ring-[3px] transition-[color,box-shadow] overflow-hidden leading-none",
  {
    variants: {
      variant: {
        default:
          "text-[rgba(255,255,255,0.87)]",
        secondary:
          "text-[#888888] border-[rgba(255,255,255,0.08)]",
        destructive:
          "text-destructive border-destructive/30",
        outline:
          "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
