export type FieldConfig = {
  fieldA: string;
  fieldB: string | null;
  fieldC: string | null;
};

const FIELD_CONFIGS: Record<string, FieldConfig> = {
  "m²": { fieldA: "Dužina", fieldB: "Visina", fieldC: null },
  "m³": { fieldA: "Dužina", fieldB: "Širina", fieldC: "Visina" },
  "m¹": { fieldA: "Dužina", fieldB: null, fieldC: null },
};

const SINGLE_FIELD: FieldConfig = { fieldA: "Količina", fieldB: null, fieldC: null };

export function getFieldConfig(unit: string): FieldConfig {
  return FIELD_CONFIGS[unit] || SINGLE_FIELD;
}

export function computeResult(a: number, b: number | null, c: number | null, multiplier: number): number {
  let result = a;
  if (b !== null && b !== undefined) result *= b;
  if (c !== null && c !== undefined) result *= c;
  return result * multiplier;
}
