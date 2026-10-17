import type { ComponentProps } from "react";

type Variant = "primary" | "secondary";
type Size = "md" | "lg";

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent",
  secondary: "bg-hover text-text",
};

const sizes: Record<Size, string> = {
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-6 text-[15px]",
};

// Também usado em links que levam a outra tela e precisam parecer botão.
export function buttonStyles(variant: Variant = "secondary", size: Size = "md"): string {
  return `inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold hover:brightness-96 ${variants[variant]} ${sizes[size]}`;
}

export function Button({ variant = "secondary", size = "md", className = "", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`${buttonStyles(variant, size)} disabled:hover:filter-none ${className}`}
      {...props}
    />
  );
}

export const linkStyles =
  "text-sm font-semibold text-accent underline decoration-line underline-offset-3 hover:decoration-current";
