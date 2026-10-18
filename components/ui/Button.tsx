import type { ComponentProps } from "react";

type Variant = "primary" | "secondary";
type Size = "md" | "lg";

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  // Contorno e sombra de carimbo: o botão "afunda" ao ser pressionado.
  primary:
    "border-2 border-edge bg-action text-on-action shadow-stamp transition-transform hover:-translate-x-px hover:-translate-y-px active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:translate-none",
  secondary: "border-2 border-transparent bg-hover text-text hover:brightness-96",
};

const sizes: Record<Size, string> = {
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-6 text-[15px]",
};

// Também usado em links que levam a outra tela e precisam parecer botão.
export function buttonStyles(variant: Variant = "secondary", size: Size = "md"): string {
  return `inline-flex items-center justify-center gap-1.5 rounded-full font-semibold whitespace-nowrap ${variants[variant]} ${sizes[size]}`;
}

export function Button({ variant = "secondary", size = "md", className = "", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`${buttonStyles(variant, size)} disabled:hover:filter-none disabled:hover:translate-none ${className}`}
      {...props}
    />
  );
}

export const linkStyles =
  "text-sm font-semibold text-accent underline decoration-line underline-offset-3 hover:decoration-current";
