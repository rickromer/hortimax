import { BRAND_LOGO_URL } from "@/lib/brand";
import { cn } from "@/lib/utils";
import React, { useState } from "react";

type HortimaxLogoProps = {
  className?: string;
  imageClassName?: string;
  lightSurface?: boolean;
};

/** Marca sin ancho rígido: preserva la relación original del isologo en cada cabecera. */
export function HortimaxLogo({ className, imageClassName, lightSurface = false }: HortimaxLogoProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <span className={cn(
      "inline-flex shrink-0 items-center justify-start overflow-hidden",
      lightSurface && "rounded-md bg-white px-2 py-1 shadow-sm",
      className,
    )}>
      {imageFailed ? (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-foreground" aria-label="HORTIMAX">
          <svg viewBox="0 0 28 28" aria-hidden="true" className="h-6 w-6 shrink-0">
            <path fill="#e9ae19" d="M3 5.5 8.4 2.4v9.1L3 14.6z" />
            <path fill="#bd1e2d" d="m10.2 7.6 5.4-3.1v9.1l-5.4 3.1z" />
            <path fill="#3c9c4a" d="m3 16.3 5.4-3.1v9.1L3 25.4z" />
            <path fill="#13aab1" d="m10.2 18.4 5.4-3.1v9.1l-5.4 3.1z" />
          </svg>
          <span className="font-semibold tracking-[0.18em] text-[0.7rem]">HORTIMAX</span>
        </span>
      ) : (
        <img
          src={BRAND_LOGO_URL}
          alt="HORTIMAX"
          className={cn("block h-auto w-auto max-w-full object-contain", imageClassName)}
          onError={() => setImageFailed(true)}
        />
      )}
    </span>
  );
}
