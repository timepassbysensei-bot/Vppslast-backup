import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "amber" | "outline" | "danger" | "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "btn btn-primary",
  amber: "btn btn-amber",
  outline: "btn btn-outline",
  danger: "btn btn-danger",
  ghost: "btn btn-ghost",
};

export function Button({ variant = "primary", className = "", children, type = "button", ...rest }: Props) {
  return (
    <button type={type} className={`${VARIANT_CLASS[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
