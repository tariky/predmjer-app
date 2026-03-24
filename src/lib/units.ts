export const UNITS = [
  { value: "m¹", label: "m¹ (dužni metar)" },
  { value: "m²", label: "m² (kvadratni metar)" },
  { value: "m³", label: "m³ (kubni metar)" },
  { value: "kom", label: "kom (komad)" },
  { value: "kg", label: "kg (kilogram)" },
  { value: "t", label: "t (tona)" },
  { value: "l", label: "l (litar)" },
  { value: "pauš.", label: "pauš. (paušalno)" },
  { value: "sat", label: "sat" },
  { value: "dan", label: "dan" },
  { value: "komplet", label: "komplet" },
] as const;

export type UnitValue = (typeof UNITS)[number]["value"];
