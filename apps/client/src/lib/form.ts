import { FieldNamesMarkedBoolean } from "react-hook-form";

export function getDirtyValues<T extends Record<string, unknown>>(
  values: T,
  dirtyFields: FieldNamesMarkedBoolean<T>,
): Partial<T> {
  const result: Partial<T> = {};

  for (const key in dirtyFields) {
    if (dirtyFields[key]) {
      result[key] = values[key];
    }
  }

  return result;
}
