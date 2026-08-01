import { z } from "zod";

type AnyObjectSchema = z.ZodObject;

function unwrap(schema: z.core.$ZodType) {
  while (
    schema instanceof z.ZodOptional ||
    schema instanceof z.ZodNullable ||
    schema instanceof z.ZodDefault
  ) {
    schema = schema.unwrap();
  }

  return schema;
}

export function getSchemaInfo<T extends AnyObjectSchema>(schema: T) {
  const shape = schema.shape;

  const keys = Object.keys(shape) as (keyof z.infer<T> & string)[];

  const optionalKeys = keys.filter((key) => shape[key].isOptional());

  const keyValueLists: Record<string, string[]> = {};

  for (const key of keys) {
    const field = unwrap(shape[key]);

    if ("type" in field && field.type === "enum") {
      if (
        "options" in field &&
        typeof field.options == "object" &&
        Array.isArray(field.options)
      ) {
        keyValueLists[key] = [...field.options];
      }
    }
  }

  return {
    keys,
    optionalKeys,
    keyValueLists,
    hasKey(key: string): key is keyof z.infer<T> & string {
      return key in shape;
    },
  };
}
