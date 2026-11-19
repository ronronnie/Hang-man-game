import { GAME_COPY } from "@hangman/game-core";
import Image from "next/image";

import type { VisualAssetSlot } from "@/assets";

interface ConfiguredVisualAssetProps {
  asset: VisualAssetSlot;
  className?: string;
  decorative?: boolean;
  priority?: boolean;
  sizes?: string;
}

export function ConfiguredVisualAsset({
  asset,
  className = "",
  decorative = false,
  priority = false,
  sizes = "100vw",
}: ConfiguredVisualAssetProps) {
  if (asset.src) {
    return (
      <div className={`configured-asset relative overflow-hidden ${className}`}>
        <Image
          alt={decorative ? "" : asset.alt}
          className={asset.fit === "cover" ? "object-cover" : "object-contain"}
          fill
          priority={priority}
          sizes={sizes}
          src={asset.src}
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : `${asset.alt} placeholder`}
      className={`configured-asset configured-asset-placeholder ${className}`}
      data-asset-placeholder="true"
      data-replacement-path={asset.replacementPath}
      role={decorative ? undefined : "img"}
    >
      <span aria-hidden="true" className="configured-asset-crosshair" />
      <span className="configured-asset-label">{asset.placeholderLabel}</span>
      <span className="configured-asset-status">{GAME_COPY.artwork.placeholder}</span>
    </div>
  );
}
