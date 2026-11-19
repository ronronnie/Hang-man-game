import type { ModeAssetConfig, VisualAssetSlot } from "@/assets";

interface ModeBackdropProps {
  config: ModeAssetConfig;
  fallbackBackground: VisualAssetSlot;
}

export function ModeBackdrop({ config, fallbackBackground }: ModeBackdropProps) {
  const backgroundSource = config.background?.src ?? fallbackBackground.src;
  const backgroundImage = backgroundSource
    ? `url(${JSON.stringify(backgroundSource)})`
    : undefined;

  return (
    <div
      aria-hidden="true"
      className="game-mode-backdrop"
      data-particle-treatment={config.particleTreatment ?? "none"}
      style={{ backgroundImage }}
    >
      <span className="game-mode-particle game-mode-particle-1" />
      <span className="game-mode-particle game-mode-particle-2" />
      <span className="game-mode-particle game-mode-particle-3" />
    </div>
  );
}
