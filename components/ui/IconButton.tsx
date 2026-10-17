import type { ComponentProps } from "react";

interface IconButtonProps extends ComponentProps<"button"> {
  "aria-label": string;
}

export function IconButton({ className = "", type = "button", ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      className={`grid size-8 shrink-0 place-items-center rounded-full text-muted enabled:hover:bg-hover ${className}`}
      {...props}
    />
  );
}
