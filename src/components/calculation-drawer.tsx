import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { getFieldConfig, computeResult } from "../lib/calculation-fields";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "./ui/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "./ui/table";
import { Plus, Trash2, Calculator, Info } from "lucide-react";
import { cn } from "../lib/utils";

type Calculation = {
  id: number;
  estimate_item_id: number;
  description: string;
  field_a: number;
  field_b: number | null;
  field_c: number | null;
  multiplier: number;
  result: number;
  sort_order: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  itemId: number;
  itemName: string;
  unit: string;
  currentQuantity: number;
  isDraft: boolean;
  onApplied: () => void;
};

function DecimalCell({
  value,
  onSave,
  disabled,
}: {
  value: number;
  onSave: (val: number) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState(value.toFixed(2));

  useEffect(() => { setText(value.toFixed(2)); }, [value]);

  if (disabled) return <span className="text-sm">{value.toFixed(2)}</span>;

  return (
    <Input
      className="h-8 text-sm text-right w-20"
      value={text}
      onChange={(e) => setText(e.target.value.replace(/[^0-9.,-]/g, ""))}
      onBlur={() => {
        const parsed = parseFloat(text.replace(",", "."));
        const final = isNaN(parsed) ? 0 : parsed;
        setText(final.toFixed(2));
        if (final !== value) onSave(final);
      }}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      inputMode="decimal"
    />
  );
}

export function CalculationDrawer({ open, onClose, itemId, itemName, unit, currentQuantity, isDraft, onApplied }: Props) {
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(false);

  const fieldConfig = getFieldConfig(unit);
  const total = calculations.reduce((sum, c) => sum + c.result, 0);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<Calculation[]>(`/api/estimate-items/${itemId}/calculations`);
      setCalculations(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    if (open) load();
  }, [open, itemId]);

  const handleAdd = async () => {
    try {
      const maxOrder = calculations.reduce((max, c) => Math.max(max, c.sort_order), -1);
      await api.post(`/api/estimate-items/${itemId}/calculations`, {
        description: "",
        field_a: 0,
        field_b: fieldConfig.fieldB ? 0 : null,
        field_c: fieldConfig.fieldC ? 0 : null,
        multiplier: 1,
        sort_order: maxOrder + 1,
      });
      load();
    } catch {}
  };

  const handleUpdate = async (calcId: number, field: string, value: number | string) => {
    const calc = calculations.find((c) => c.id === calcId);
    if (!calc) return;

    const updated = { ...calc, [field]: value };
    const newResult = computeResult(
      updated.field_a, updated.field_b, updated.field_c, updated.multiplier
    );

    // Optimistic update
    setCalculations((prev) =>
      prev.map((c) => c.id === calcId ? { ...c, [field]: value, result: newResult } : c)
    );

    try {
      await api.put(`/api/item-calculations/${calcId}`, { [field]: value });
    } catch { load(); }
  };

  const handleDelete = async (calcId: number) => {
    setCalculations((prev) => prev.filter((c) => c.id !== calcId));
    try {
      await api.delete(`/api/item-calculations/${calcId}`);
    } catch { load(); }
  };

  const handleApply = async () => {
    try {
      await api.post(`/api/estimate-items/${itemId}/calculations/apply`);
      onApplied();
      onClose();
    } catch {}
  };

  // Column count for colspan
  let colCount = 4; // description + result + multiplier + total
  if (fieldConfig.fieldB) colCount++;
  if (fieldConfig.fieldC) colCount++;
  if (isDraft) colCount++; // delete button

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-[65vw] max-w-[900px] sm:max-w-[900px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg">Dokaznica mjera</SheetTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{itemName}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{unit}</Badge>
              <Badge variant="outline">Trenutno: {currentQuantity.toFixed(2)}</Badge>
            </div>
          </div>
        </SheetHeader>

        {/* Tip */}
        <div className="mx-6 mt-4 mb-0 flex items-start gap-2 rounded-md bg-muted/50 border border-border px-3 py-2 text-xs text-muted-foreground">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>Za oduzimanje (prozori, vrata, prodori) unesite negativan množilac, npr. <strong className="text-foreground">-1</strong> ili <strong className="text-foreground">-2</strong>.</span>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Učitavanje...</div>
          ) : calculations.length === 0 ? (
            <div className="text-center py-16">
              <Calculator className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground mb-3">Nema kalkulacija.</p>
              {isDraft && (
                <Button variant="outline" size="sm" onClick={handleAdd}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Dodaj prvi red
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Opis</TableHead>
                  <TableHead className="text-right">{fieldConfig.fieldA}</TableHead>
                  {fieldConfig.fieldB && <TableHead className="text-right">{fieldConfig.fieldB}</TableHead>}
                  {fieldConfig.fieldC && <TableHead className="text-right">{fieldConfig.fieldC}</TableHead>}
                  <TableHead className="text-right">Rezultat</TableHead>
                  <TableHead className="text-right w-[80px]">Množilac</TableHead>
                  <TableHead className="text-right">Ukupno</TableHead>
                  {isDraft && <TableHead className="w-[40px]" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculations.map((calc) => (
                  <TableRow
                    key={calc.id}
                    className={cn(calc.multiplier < 0 && "bg-destructive/5")}
                  >
                    <TableCell>
                      {isDraft ? (
                        <Input
                          className="h-8 text-sm"
                          defaultValue={calc.description}
                          onBlur={(e) => handleUpdate(calc.id, "description", e.target.value)}
                          placeholder="Opis..."
                        />
                      ) : (
                        <span className="text-sm">{calc.description}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DecimalCell value={calc.field_a} onSave={(v) => handleUpdate(calc.id, "field_a", v)} disabled={!isDraft} />
                    </TableCell>
                    {fieldConfig.fieldB && (
                      <TableCell className="text-right">
                        <DecimalCell value={calc.field_b ?? 0} onSave={(v) => handleUpdate(calc.id, "field_b", v)} disabled={!isDraft} />
                      </TableCell>
                    )}
                    {fieldConfig.fieldC && (
                      <TableCell className="text-right">
                        <DecimalCell value={calc.field_c ?? 0} onSave={(v) => handleUpdate(calc.id, "field_c", v)} disabled={!isDraft} />
                      </TableCell>
                    )}
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {computeResult(calc.field_a, calc.field_b, calc.field_c, 1).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DecimalCell value={calc.multiplier} onSave={(v) => handleUpdate(calc.id, "multiplier", v)} disabled={!isDraft} />
                    </TableCell>
                    <TableCell className={cn("text-right font-medium text-sm", calc.result < 0 && "text-destructive")}>
                      {calc.result.toFixed(2)}
                    </TableCell>
                    {isDraft && (
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(calc.id)}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {/* Total row */}
                <TableRow className="border-t-2 border-border">
                  <TableCell colSpan={colCount - (isDraft ? 2 : 1)} className="text-right font-bold">
                    UKUPNO:
                  </TableCell>
                  <TableCell className={cn("text-right font-bold text-base", total < 0 && "text-destructive")}>
                    {total.toFixed(2)}
                  </TableCell>
                  {isDraft && <TableCell />}
                </TableRow>
              </TableBody>
            </Table>
          )}

          {isDraft && calculations.length > 0 && (
            <Button variant="outline" size="sm" className="mt-3" onClick={handleAdd}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Dodaj red
            </Button>
          )}
        </div>

        {/* Footer */}
        <SheetFooter className="px-6 py-4 border-t border-border flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Zatvori</Button>
          {isDraft && calculations.length > 0 && (
            <Button onClick={handleApply}>
              Primijeni ({total.toFixed(2)})
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
