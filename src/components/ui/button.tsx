import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Buttons per Designs.md:
 * - Primary: solid charcoal, ivory text. No shadow. 4px radius.
 * - Outline: transparent with 1px ink border.
 * - Tertiary: underlined text with wide tracking.
 * Button text is the uppercase micro-label style throughout the mockups.
 */
const buttonVariants = cva(
  "type-label inline-flex items-center justify-center gap-2 rounded cursor-pointer transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-ink text-ivory hover:bg-ink/85",
        outline:
          "border border-ink bg-transparent text-ink hover:bg-ink hover:text-ivory",
        tertiary:
          "underline underline-offset-4 decoration-1 text-ink hover:text-bronze px-0",
        ghost: "text-muted hover:text-ink",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-6",
        lg: "h-13 px-8",
      },
    },
    compoundVariants: [
      { variant: "tertiary", size: ["sm", "md", "lg"], className: "h-auto px-0" },
    ],
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
