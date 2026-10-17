import type { ComponentProps } from "react";

interface ButtonProps extends ComponentProps<"button"> {
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
}

const variants = {
  primary: "bg-accent text-on-accent",
  secondary: "bg-hover text-text",
};

const sizes = {
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-6 text-[15px]",
};

export function Button({ variant = "secondary", size = "md", className = "", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold enabled:hover:brightness-96 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

export const linkStyles =
  "text-sm font-semibold text-accent underline decoration-line underline-offset-3 hover:decoration-current";
