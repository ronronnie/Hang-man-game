import type { AssetFit, VisualAssetSlot } from "./types";

export function placeholderAsset(
  replacementPath: string,
  placeholderLabel: string,
  alt: string,
  fit: AssetFit = "contain",
): VisualAssetSlot {
  return Object.freeze({
    src: null,
    replacementPath,
    alt,
    placeholderLabel,
    fit,
  });
}

export function imageAsset(
  src: string,
  alt: string,
  fit: AssetFit = "contain",
): VisualAssetSlot {
  return Object.freeze({
    src,
    replacementPath: src,
    alt,
    placeholderLabel: alt,
    fit,
  });
}
