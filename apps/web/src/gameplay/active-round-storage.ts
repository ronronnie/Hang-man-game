import type { CategoryId, GameModeId, GameState, RegionPreference } from "@hangman/game-core";
import type { StorageAdapter } from "@hangman/shared";

const ACTIVE_ROUND_SCHEMA_VERSION = 1;

export interface ActiveRoundSnapshot {
  schemaVersion: typeof ACTIVE_ROUND_SCHEMA_VERSION;
  roundToken: string;
  modeId: GameModeId;
  selectedCategoryId: CategoryId;
  regionPreference?: RegionPreference;
  savedAtEpochMs: number;
  state: GameState;
}

interface RoundIdentity {
  roundToken: string;
  modeId: GameModeId;
  selectedCategoryId: CategoryId;
  regionPreference?: RegionPreference;
}

export function getActiveRoundStorageKey(roundToken: string): string {
  return `active-round:${roundToken}`;
}

export async function loadActiveRound(
  storage: StorageAdapter,
  identity: RoundIdentity,
): Promise<ActiveRoundSnapshot | null> {
  const key = getActiveRoundStorageKey(identity.roundToken);
  const snapshot = await storage.get<ActiveRoundSnapshot>(key);

  if (
    !snapshot ||
    snapshot.schemaVersion !== ACTIVE_ROUND_SCHEMA_VERSION ||
    snapshot.roundToken !== identity.roundToken ||
    snapshot.modeId !== identity.modeId ||
    snapshot.selectedCategoryId !== identity.selectedCategoryId ||
    (snapshot.regionPreference !== undefined &&
      identity.regionPreference !== undefined &&
      snapshot.regionPreference !== identity.regionPreference) ||
    !Number.isFinite(snapshot.savedAtEpochMs) ||
    !snapshot.state ||
    !["ready", "playing", "won", "lost"].includes(snapshot.state.status)
  ) {
    if (snapshot) await storage.remove(key);
    return null;
  }

  return snapshot;
}

export async function saveActiveRound(
  storage: StorageAdapter,
  identity: RoundIdentity,
  state: Readonly<GameState>,
): Promise<void> {
  await storage.set<ActiveRoundSnapshot>(getActiveRoundStorageKey(identity.roundToken), {
    schemaVersion: ACTIVE_ROUND_SCHEMA_VERSION,
    ...identity,
    savedAtEpochMs: Date.now(),
    state,
  });
}

export async function clearActiveRound(
  storage: StorageAdapter,
  roundToken: string,
): Promise<void> {
  await storage.remove(getActiveRoundStorageKey(roundToken));
}
