import type { CategoryId, RegionPreference, WordId } from "@hangman/game-core";
import type { StorageAdapter } from "@hangman/shared";

const RECENT_WORD_HISTORY_VERSION = 1;

interface RecentWordHistory {
  version: typeof RECENT_WORD_HISTORY_VERSION;
  wordIds: WordId[];
}

function getHistoryKey(categoryId: CategoryId, regionPreference: RegionPreference): string {
  return `recent-words:${regionPreference}:${categoryId}`;
}

export async function loadRecentWordIds(
  storage: StorageAdapter,
  categoryId: CategoryId,
  regionPreference: RegionPreference,
): Promise<readonly WordId[]> {
  const key = getHistoryKey(categoryId, regionPreference);
  let history = await storage.get<RecentWordHistory>(key);
  if (!history && regionPreference === "mixed") {
    const legacyKey = `recent-words:${categoryId}`;
    history = await storage.get<RecentWordHistory>(legacyKey);
    if (history) {
      await storage.set(key, history);
      await storage.remove(legacyKey);
    }
  }
  if (!history || history.version !== RECENT_WORD_HISTORY_VERSION || !Array.isArray(history.wordIds)) {
    if (history) await storage.remove(key);
    return [];
  }

  return [...new Set(history.wordIds.filter((id): id is WordId => typeof id === "string"))];
}

export async function saveRecentWordIds(
  storage: StorageAdapter,
  categoryId: CategoryId,
  regionPreference: RegionPreference,
  wordIds: readonly WordId[],
): Promise<void> {
  await storage.set<RecentWordHistory>(getHistoryKey(categoryId, regionPreference), {
    version: RECENT_WORD_HISTORY_VERSION,
    wordIds: [...new Set(wordIds)],
  });
}

export async function rememberWord(
  storage: StorageAdapter,
  selectedCategoryId: CategoryId,
  regionPreference: RegionPreference,
  wordId: WordId,
  actualCategoryId: CategoryId,
): Promise<void> {
  const categories = selectedCategoryId === actualCategoryId
    ? [selectedCategoryId]
    : [selectedCategoryId, actualCategoryId];

  await Promise.all(
    categories.map(async (categoryId) => {
      const history = await loadRecentWordIds(storage, categoryId, regionPreference);
      await saveRecentWordIds(
        storage,
        categoryId,
        regionPreference,
        [...history.filter((id) => id !== wordId), wordId],
      );
    }),
  );
}
