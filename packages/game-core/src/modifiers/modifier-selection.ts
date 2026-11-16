import type { ActiveModifier, ModifierDefinition, ModifierId } from "../types/modifier";

export function getActiveModifier<Id extends ModifierId>(
  modifiers: readonly ActiveModifier[],
  id: Id,
): Extract<ActiveModifier, { id: Id }> | null {
  return (modifiers.find((modifier) => modifier.id === id) as
    | Extract<ActiveModifier, { id: Id }>
    | undefined) ?? null;
}

export function selectRoundModifier(
  definitions: readonly ModifierDefinition[],
  pool: readonly ModifierId[],
  randomValue: number,
  activatedAtTurn = 0,
): ActiveModifier | null {
  if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
    throw new RangeError("randomValue must be greater than or equal to 0 and less than 1");
  }

  const poolIds = new Set(pool);
  const eligible = definitions.filter(
    (definition) => definition.enabled && definition.selectionWeight > 0 && poolIds.has(definition.id),
  );
  const totalWeight = eligible.reduce((total, definition) => total + definition.selectionWeight, 0);
  if (totalWeight === 0) return null;

  const target = randomValue * totalWeight;
  let cursor = 0;
  const selected =
    eligible.find((definition) => {
      cursor += definition.selectionWeight;
      return target < cursor;
    }) ?? eligible.at(-1);

  if (!selected) return null;

  return Object.freeze({
    id: selected.id,
    activatedAtTurn,
    config: Object.freeze({ ...selected.config }),
  }) as ActiveModifier;
}
