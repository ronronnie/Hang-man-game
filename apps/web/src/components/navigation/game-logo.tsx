import Link from "next/link";

import { UI_ASSETS } from "@/assets";
import type { VisualAssetSlot } from "@/assets";
import { ConfiguredVisualAsset } from "@/components/assets/configured-visual-asset";

export function GameLogo({ asset = UI_ASSETS.logo }: { asset?: VisualAssetSlot }) {
  return (
    <Link className="game-logo-link inline-flex items-center gap-2 text-sm font-black tracking-[0.18em]" href="/">
      <ConfiguredVisualAsset
        asset={asset}
        className="game-logo-mark size-7 rounded-md"
        decorative
        sizes="28px"
      />
      HANGMAN
    </Link>
  );
}
