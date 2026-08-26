import { BRAND_LOGO_URL } from "@/lib/brand";
import { cn } from "@/lib/utils";
import React from "react";

type HortimaxLogoProps = {
  className?: string;
  imageClassName?: string;
  lightSurface?: boolean;
};

/** Marca sin ancho rígido: preserva la relación original del isologo en cada cabecera. */
export function HortimaxLogo({ className, imageClassName, lightSurface = false }: HortimaxLogoProps) {
  return (
    <span className={cn(
      "inline-flex shrink-0 items-center justify-start overflow-hidden",
      lightSurface && "rounded-md bg-white px-2 py-1 shadow-sm",
      className,
    )}>
      <img
        src={BRAND_LOGO_URL}
        alt="HORTIMAX"
        className={cn("block h-auto w-auto max-w-full object-contain", imageClassName)}
      />
    </span>
  );
}
