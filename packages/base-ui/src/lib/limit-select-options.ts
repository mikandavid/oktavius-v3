/** Max options rendered in Combobox / MultiSelect before prompting to search. */
export const SELECT_OPTIONS_DISPLAY_CAP = 50;

export type LimitedSelectOptions<T extends { value: string }> = {
  visible: T[];
  total: number;
  truncated: number;
};

/**
 * Caps long option lists for dropdown performance.
 * Keeps the current selection visible even when it falls outside the first slice.
 */
export function limitSelectOptions<T extends { value: string }>(
  options: T[],
  {
    max = SELECT_OPTIONS_DISPLAY_CAP,
    selectedValue,
    selectedValues,
  }: {
    max?: number;
    selectedValue?: string | null;
    selectedValues?: string[];
  } = {},
): LimitedSelectOptions<T> {
  const total = options.length;
  if (total <= max) {
    return { visible: options, total, truncated: 0 };
  }

  const pinnedValues = new Set<string>();
  if (selectedValue) pinnedValues.add(selectedValue);
  selectedValues?.forEach((value) => pinnedValues.add(value));

  const visible: T[] = [];
  const seen = new Set<string>();

  for (const option of options) {
    if (!pinnedValues.has(option.value)) continue;
    visible.push(option);
    seen.add(option.value);
  }

  for (const option of options) {
    if (visible.length >= max) break;
    if (seen.has(option.value)) continue;
    visible.push(option);
    seen.add(option.value);
  }

  return { visible, total, truncated: total - visible.length };
}
