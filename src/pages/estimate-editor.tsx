import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";
import { Textarea } from "../components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { UNITS } from "../lib/units";
import { AiDescriptionButton } from "../components/ai-description-button";
import {
  ArrowLeft, ChevronDown, ChevronRight, Plus, Trash2, Library,
  FileDown, FileSpreadsheet, Lock, Unlock, GripVertical, Calculator, Percent,
} from "lucide-react";
import { CalculationDrawer } from "../components/calculation-drawer";
import { Switch } from "../components/ui/switch";

function DecimalInput({
  value,
  onSave,
  className,
}: {
  value: number;
  onSave: (val: number) => void;
  className?: string;
}) {
  const [text, setText] = useState(value.toFixed(2));

  useEffect(() => {
    setText(value.toFixed(2));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow digits, dot, comma, and minus
    const raw = e.target.value.replace(/[^0-9.,-]/g, "");
    setText(raw);
  };

  const handleBlur = () => {
    // Normalize: replace comma with dot, parse
    const normalized = text.replace(",", ".");
    const parsed = parseFloat(normalized);
    const final = isNaN(parsed) ? 0 : parsed;
    setText(final.toFixed(2));
    if (final !== value) {
      onSave(final);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <Input
      className={className}
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onFocus={(e) => e.target.select()}
      inputMode="decimal"
    />
  );
}
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type EstimateItem = {
  id: number;
  estimate_group_id: number;
  library_item_id: number | null;
  name: string;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  sort_order: number;
};

type EstimateGroup = {
  id: number;
  estimate_id: number;
  group_name: string;
  sort_order: number;
  items: EstimateItem[];
};

type Estimate = {
  id: number;
  name: string;
  client_name: string;
  location: string;
  notes: string;
  status: "draft" | "finished";
  created_by: number;
  pdv_enabled: number;
  discount_type: "none" | "amount" | "percentage";
  discount_value: number;
  groups: EstimateGroup[];
};

type LibraryItem = {
  id: number;
  group_id: number;
  name: string;
  description: string;
  unit: string;
  unit_price: number;
  created_by: number | null;
};

type ItemGroup = {
  id: number;
  name: string;
};

function SortableGroupRow({
  group,
  isDraft,
  onToggle,
  isOpen,
  children,
}: {
  group: EstimateGroup;
  isDraft: boolean;
  onToggle: () => void;
  isOpen: boolean;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: `group-${group.id}`,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const subtotal = group.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  return (
    <div ref={setNodeRef} style={style}>
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <div className="flex items-center gap-2 p-3 bg-secondary rounded-t-lg border border-border">
          {isDraft && (
            <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
              <GripVertical className="w-4 h-4" />
            </button>
          )}
          <CollapsibleTrigger className="flex items-center gap-2 flex-1">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="font-semibold">{group.group_name}</span>
            <span className="text-sm text-muted-foreground ml-auto">
              ({group.items.length} stavki) — {subtotal.toFixed(2)} KM
            </span>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          {children}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function SortableItemRow({
  item,
  isDraft,
  index,
  children,
}: {
  item: EstimateItem;
  isDraft: boolean;
  index: number;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: `item-${item.id}`,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-stretch ${index % 2 === 0 ? "bg-background" : "bg-muted"}`}>
      {isDraft && (
        <div className="flex items-center px-2 flex-shrink-0">
          <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
            <GripVertical className="w-4 h-4" />
          </button>
        </div>
      )}
      {children}
    </div>
  );
}

export function EstimateEditor({ id, onBack }: { id: number; onBack: () => void }) {
  const { user } = useAuth();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set());
  const [showLibrary, setShowLibrary] = useState<{ groupId: number } | null>(null);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [groupSuggestions, setGroupSuggestions] = useState<ItemGroup[]>([]);

  // Library state
  const [libraryGroups, setLibraryGroups] = useState<ItemGroup[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [libGroupFilter, setLibGroupFilter] = useState<string>("all");
  const [libSearch, setLibSearch] = useState("");
  const [hideSystemItems, setHideSystemItems] = useState(false);
  const [calcDrawer, setCalcDrawer] = useState<{ itemId: number; itemName: string; unit: string; quantity: number } | null>(null);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustField, setAdjustField] = useState<"unit_price" | "quantity">("unit_price");
  const [adjustPercent, setAdjustPercent] = useState("");
  const [adjustGroupId, setAdjustGroupId] = useState<string>("all");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = useCallback(async () => {
    try {
      const data = await api.get<Estimate>(`/api/estimates/${id}`);
      setEstimate(data);
      if (openGroups.size === 0 && data.groups.length > 0) {
        setOpenGroups(new Set(data.groups.map((g) => g.id)));
      }
    } catch {}
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);


  if (!estimate) return <div className="p-6 text-muted-foreground">Ucitavanje...</div>;

  const isDraft = estimate.status === "draft";
  const grandTotal = estimate.groups.reduce(
    (sum, g) => sum + g.items.reduce((s, item) => s + item.quantity * item.unit_price, 0),
    0
  );

  const handleMetaUpdate = async (field: string, value: string | number) => {
    const numericFields = ["pdv_enabled", "discount_value"];
    const val = numericFields.includes(field) ? Number(value) : value;
    await api.put(`/api/estimates/${id}`, { [field]: val });
    load();
  };

  const handleStatusToggle = async () => {
    const newStatus = estimate.status === "draft" ? "finished" : "draft";
    await api.put(`/api/estimates/${id}/status`, { status: newStatus });
    load();
  };

  const handleAdjust = async () => {
    const pct = parseFloat(adjustPercent.replace(",", "."));
    if (isNaN(pct) || pct === 0) return;
    const body: any = { field: adjustField, percentage: pct };
    if (adjustGroupId !== "all") body.group_id = parseInt(adjustGroupId);
    await api.post(`/api/estimates/${id}/adjust`, body);
    setShowAdjust(false);
    setAdjustPercent("");
    load();
  };

  const handleAddGroup = async (name?: string) => {
    const groupName = name || newGroupName;
    if (!groupName.trim()) return;
    const maxOrder = Math.max(0, ...estimate.groups.map((g) => g.sort_order));
    await api.post(`/api/estimates/${id}/groups`, { group_name: groupName, sort_order: maxOrder + 1 });
    setNewGroupName("");
    setShowAddGroup(false);
    load();
  };

  const loadGroupSuggestions = async () => {
    try {
      const groups = await api.get<ItemGroup[]>("/api/item-groups");
      setGroupSuggestions(groups);
    } catch (e) {
      console.error("Failed to load group suggestions:", e);
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm("Obrisati grupu i sve stavke u njoj?")) return;
    await api.delete(`/api/estimate-groups/${groupId}`);
    load();
  };

  const handleAddManualItem = async (groupId: number) => {
    const maxOrder = estimate.groups
      .find((g) => g.id === groupId)
      ?.items.reduce((max, i) => Math.max(max, i.sort_order), 0) ?? 0;
    await api.post(`/api/estimate-groups/${groupId}/items`, {
      name: "Nova stavka",
      description: "",
      unit: "kom",
      quantity: 0,
      unit_price: 0,
      sort_order: maxOrder + 1,
    });
    load();
  };

  const handleAddFromLibrary = async (groupId: number, libItem: LibraryItem) => {
    const group = estimate.groups.find((g) => g.id === groupId);
    const maxOrder = group?.items.reduce((max, i) => Math.max(max, i.sort_order), 0) ?? 0;
    await api.post(`/api/estimate-groups/${groupId}/items`, {
      library_item_id: libItem.id,
      name: libItem.name,
      description: libItem.description,
      unit: libItem.unit,
      quantity: 0,
      unit_price: libItem.unit_price,
      sort_order: maxOrder + 1,
    });
    load();
  };

  const handleUpdateItem = async (itemId: number, field: string, value: string | number) => {
    await api.put(`/api/estimate-items/${itemId}`, { [field]: value });
    load();
  };

  const handleDeleteItem = async (itemId: number) => {
    await api.delete(`/api/estimate-items/${itemId}`);
    load();
  };

  const handleGroupDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = estimate.groups.findIndex((g) => `group-${g.id}` === active.id);
    const newIndex = estimate.groups.findIndex((g) => `group-${g.id}` === over.id);
    const reordered = arrayMove(estimate.groups, oldIndex, newIndex);

    setEstimate({ ...estimate, groups: reordered });

    for (let i = 0; i < reordered.length; i++) {
      await api.put(`/api/estimate-groups/${reordered[i].id}`, { sort_order: i });
    }
  };

  const handleItemDragEnd = async (groupId: number, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const group = estimate.groups.find((g) => g.id === groupId);
    if (!group) return;

    const oldIndex = group.items.findIndex((i) => `item-${i.id}` === active.id);
    const newIndex = group.items.findIndex((i) => `item-${i.id}` === over.id);
    const reordered = arrayMove(group.items, oldIndex, newIndex);

    // Optimistic update
    setEstimate({
      ...estimate,
      groups: estimate.groups.map((g) =>
        g.id === groupId ? { ...g, items: reordered } : g
      ),
    });

    for (let i = 0; i < reordered.length; i++) {
      await api.put(`/api/estimate-items/${reordered[i].id}`, { sort_order: i });
    }
  };

  const openLibraryDialog = async (groupId: number) => {
    setShowLibrary({ groupId });
    setLibSearch("");

    try {
      const [groups, items, hiddenIds] = await Promise.all([
        api.get<ItemGroup[]>("/api/item-groups"),
        api.get<LibraryItem[]>("/api/library-items"),
        api.get<number[]>("/api/library-items/hidden"),
      ]);
      const hiddenSet = new Set(hiddenIds);
      setLibraryGroups(groups);
      setLibraryItems(items.filter((i) => !hiddenSet.has(i.id)));

      // Auto-select matching library group based on estimate group name
      const estimateGroup = estimate.groups.find((g) => g.id === groupId);
      if (estimateGroup) {
        const matchingGroup = groups.find(
          (g) => g.name.toLowerCase() === estimateGroup.group_name.toLowerCase()
        );
        setLibGroupFilter(matchingGroup ? matchingGroup.id.toString() : "all");
      } else {
        setLibGroupFilter("all");
      }
    } catch {}
  };

  const filteredLibItems = libraryItems.filter((item) => {
    if (hideSystemItems && item.created_by === null) return false;
    const matchGroup = libGroupFilter === "all" || item.group_id === parseInt(libGroupFilter);
    const matchSearch = item.name.toLowerCase().includes(libSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(libSearch.toLowerCase());
    return matchGroup && matchSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1" />

        {/* Status toggle */}
        <button
          onClick={handleStatusToggle}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide uppercase transition-all ${
            isDraft
              ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isDraft ? "bg-amber-500" : "bg-emerald-500"}`} />
          {isDraft ? "Nacrt" : "Završen"}
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-border" />

        {/* Actions group */}
        <div className="flex items-center rounded-lg border border-border bg-card overflow-hidden divide-x divide-border">
          {isDraft && (
            <button
              onClick={() => setShowAdjust(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Percent className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Korekcija</span>
            </button>
          )}
          <button
            onClick={() => window.open(`/api/estimates/${id}/export/pdf`, "_blank")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-red-500" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => window.open(`/api/estimates/${id}/export/excel`, "_blank")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Meta fields */}
      <div className="space-y-1">
        <Label className="text-muted-foreground text-xs">Naziv predmjera</Label>
        {isDraft ? (
          <Input
            key={`est-name-${estimate.name}`}
            defaultValue={estimate.name}
            onBlur={(e) => handleMetaUpdate("name", e.target.value)}
            placeholder="Naziv predmjera"
          />
        ) : (
          <p className="text-sm">{estimate.name}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Investitor</Label>
          {isDraft ? (
            <Input
              defaultValue={estimate.client_name}
              onBlur={(e) => handleMetaUpdate("client_name", e.target.value)}
              placeholder="Naziv investitora"
            />
          ) : (
            <p className="text-sm">{estimate.client_name || "—"}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Lokacija</Label>
          {isDraft ? (
            <Input
              defaultValue={estimate.location}
              onBlur={(e) => handleMetaUpdate("location", e.target.value)}
              placeholder="Lokacija projekta"
            />
          ) : (
            <p className="text-sm">{estimate.location || "—"}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <Label className="text-muted-foreground text-xs">Dodatna napomena</Label>
        {isDraft ? (
          <Textarea
            key={`notes-${estimate.notes}`}
            className="text-sm min-h-[60px] resize-y"
            defaultValue={estimate.notes}
            onBlur={(e) => handleMetaUpdate("notes", e.target.value)}
            placeholder="Dodatne informacije, napomene, uslovi..."
          />
        ) : (
          estimate.notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{estimate.notes}</p>
        )}
      </div>

      {/* Groups */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>
        <SortableContext
          items={estimate.groups.map((g) => `group-${g.id}`)}
          strategy={verticalListSortingStrategy}
          disabled={!isDraft}
        >
          <div className="space-y-4">
            {estimate.groups.map((group) => (
              <SortableGroupRow
                key={group.id}
                group={group}
                isDraft={isDraft}
                isOpen={openGroups.has(group.id)}
                onToggle={() => {
                  const next = new Set(openGroups);
                  if (next.has(group.id)) next.delete(group.id);
                  else next.add(group.id);
                  setOpenGroups(next);
                }}
              >
                <div className="border border-t-0 border-border rounded-b-lg">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => handleItemDragEnd(group.id, e)}
                  >
                    <SortableContext
                      items={group.items.map((i) => `item-${i.id}`)}
                      strategy={verticalListSortingStrategy}
                      disabled={!isDraft}
                    >
                      <div className="divide-y divide-border">
                        {group.items.map((item, index) => (
                          <SortableItemRow key={item.id} item={item} isDraft={isDraft} index={index}>
                            <div className="flex-1 p-4 space-y-3">
                              {/* Row 1: Name + Actions */}
                              <div className="flex items-start gap-3">
                                {isDraft ? (
                                  <Input
                                    key={`name-${item.id}-${item.name}`}
                                    className="h-9 text-sm font-semibold flex-1"
                                    defaultValue={item.name}
                                    onBlur={(e) => handleUpdateItem(item.id, "name", e.target.value)}
                                  />
                                ) : (
                                  <div className="flex-1 font-semibold text-sm pt-1">{item.name}</div>
                                )}
                                {isDraft && (
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <AiDescriptionButton
                                      onResult={async ({ name, description }) => {
                                        const updates: Record<string, string> = { description };
                                        if (name) updates.name = name;
                                        await api.put(`/api/estimate-items/${item.id}`, updates);
                                        load();
                                      }}
                                    />
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive/60 hover:text-destructive" onClick={() => handleDeleteItem(item.id)}>
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                )}
                              </div>

                              {/* Row 2: Description */}
                              {isDraft ? (
                                <Textarea
                                  key={`desc-${item.id}-${item.description}`}
                                  className="text-sm text-foreground min-h-[48px] resize-y"
                                  defaultValue={item.description}
                                  onBlur={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                                  placeholder="Opis stavke..."
                                />
                              ) : (
                                item.description && (
                                  <p className="text-sm text-foreground">{item.description}</p>
                                )
                              )}

                              {/* Row 3: Numbers bar */}
                              <div className="flex items-center gap-3 pt-1">
                                {/* Unit */}
                                <div className="space-y-1">
                                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Jed.</div>
                                  {isDraft ? (
                                    <Select value={item.unit} onValueChange={(v) => handleUpdateItem(item.id, "unit", v)}>
                                      <SelectTrigger className="h-8 text-sm w-44">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {UNITS.map((u) => (
                                          <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <div className="text-sm h-8 flex items-center">{item.unit}</div>
                                  )}
                                </div>

                                {/* Quantity */}
                                <div className="space-y-1">
                                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Kolicina</div>
                                  {isDraft ? (
                                    <div className="flex items-center gap-1">
                                      <DecimalInput
                                        className="h-8 text-sm text-right w-24"
                                        value={item.quantity}
                                        onSave={(val) => handleUpdateItem(item.id, "quantity", val)}
                                      />
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 flex-shrink-0"
                                        onClick={() => setCalcDrawer({ itemId: item.id, itemName: item.name, unit: item.unit, quantity: item.quantity })}
                                        title="Dokaznica mjera"
                                      >
                                        <Calculator className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="text-sm h-8 flex items-center gap-1">
                                      {item.quantity.toFixed(2)}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => setCalcDrawer({ itemId: item.id, itemName: item.name, unit: item.unit, quantity: item.quantity })}
                                      >
                                        <Calculator className="w-3 h-3 text-muted-foreground" />
                                      </Button>
                                    </div>
                                  )}
                                </div>

                                {/* Unit price */}
                                <div className="space-y-1">
                                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Jed. cijena</div>
                                  {isDraft ? (
                                    <DecimalInput
                                      className="h-8 text-sm text-right w-24"
                                      value={item.unit_price}
                                      onSave={(val) => handleUpdateItem(item.id, "unit_price", val)}
                                    />
                                  ) : (
                                    <div className="text-sm h-8 flex items-center">{item.unit_price.toFixed(2)}</div>
                                  )}
                                </div>

                                <div className="flex-1" />

                                {/* Total */}
                                <div className="space-y-1 text-right">
                                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Ukupno</div>
                                  <div className="text-sm font-bold h-8 flex items-center justify-end text-primary">
                                    {(item.quantity * item.unit_price).toFixed(2)} KM
                                  </div>
                                </div>
                              </div>
                            </div>
                          </SortableItemRow>
                        ))}
                        {group.items.length === 0 && (
                          <div className="text-center text-muted-foreground py-8 text-sm">
                            Nema stavki u ovoj grupi
                          </div>
                        )}
                      </div>
                    </SortableContext>
                  </DndContext>
                  {isDraft && (
                    <div className="flex items-center gap-2 p-2 border-t border-border">
                      <Button variant="ghost" size="sm" onClick={() => handleAddManualItem(group.id)}>
                        <Plus className="w-3 h-3 mr-1" /> Rucno dodaj
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openLibraryDialog(group.id)}>
                        <Library className="w-3 h-3 mr-1" /> Iz biblioteke
                      </Button>
                      <div className="flex-1" />
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteGroup(group.id)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Obrisi grupu
                      </Button>
                    </div>
                  )}
                </div>
              </SortableGroupRow>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add group */}
      {isDraft && (
        <Dialog open={showAddGroup} onOpenChange={(open) => {
          setShowAddGroup(open);
          if (open) {
            setNewGroupName("");
            loadGroupSuggestions();
          }
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full border-dashed">
              <Plus className="w-4 h-4 mr-2" /> Dodaj grupu radova
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Dodaj grupu radova</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Pretrazi ili upisi naziv grupe..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newGroupName.trim()) {
                    handleAddGroup();
                  }
                }}
              />
              <div className="max-h-[300px] overflow-y-auto space-y-0.5">
                {groupSuggestions
                  .filter((g) =>
                    !newGroupName.trim() ||
                    g.name.toLowerCase().includes(newGroupName.toLowerCase())
                  )
                  .filter((g) => !estimate.groups.some((eg) => eg.group_name === g.name))
                  .map((g) => (
                    <button
                      key={g.id}
                      className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-secondary transition-colors"
                      onClick={() => handleAddGroup(g.name)}
                    >
                      {g.name}
                    </button>
                  ))
                }
                {newGroupName.trim() &&
                  !groupSuggestions.some((g) => g.name.toLowerCase() === newGroupName.toLowerCase()) && (
                  <button
                    className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-secondary transition-colors text-primary"
                    onClick={() => handleAddGroup()}
                  >
                    <Plus className="w-3 h-3 inline mr-1" />
                    Kreiraj "{newGroupName}"
                  </button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Recapitulation */}
      {estimate.groups.length > 0 && (() => {
        const discountAmount = estimate.discount_type === "percentage"
          ? grandTotal * estimate.discount_value / 100
          : estimate.discount_type === "amount"
            ? estimate.discount_value
            : 0;
        const afterDiscount = grandTotal - discountAmount;
        const pdvAmount = estimate.pdv_enabled ? afterDiscount * 0.17 : 0;
        const finalTotal = afterDiscount + pdvAmount;

        return (
          <Card>
            <CardHeader>
              <CardTitle>Rekapitulacija</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grupa radova</TableHead>
                    <TableHead className="text-right">Iznos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estimate.groups.map((group) => {
                    const subtotal = group.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
                    return (
                      <TableRow key={group.id}>
                        <TableCell>{group.group_name}</TableCell>
                        <TableCell className="text-right">{subtotal.toFixed(2)} KM</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="font-semibold">
                    <TableCell>Ukupno bez popusta</TableCell>
                    <TableCell className="text-right">{grandTotal.toFixed(2)} KM</TableCell>
                  </TableRow>
                  {estimate.discount_type !== "none" && discountAmount > 0 && (
                    <TableRow className="text-destructive">
                      <TableCell>
                        Popust {estimate.discount_type === "percentage" ? `(${estimate.discount_value}%)` : ""}
                      </TableCell>
                      <TableCell className="text-right">-{discountAmount.toFixed(2)} KM</TableCell>
                    </TableRow>
                  )}
                  {estimate.discount_type !== "none" && discountAmount > 0 && (
                    <TableRow className="font-semibold">
                      <TableCell>Ukupno sa popustom</TableCell>
                      <TableCell className="text-right">{afterDiscount.toFixed(2)} KM</TableCell>
                    </TableRow>
                  )}
                  {!!estimate.pdv_enabled && (
                    <TableRow>
                      <TableCell>PDV (17%)</TableCell>
                      <TableCell className="text-right">{pdvAmount.toFixed(2)} KM</TableCell>
                    </TableRow>
                  )}
                  <TableRow className="font-bold text-lg">
                    <TableCell>UKUPNO</TableCell>
                    <TableCell className="text-right text-primary">{finalTotal.toFixed(2)} KM</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {/* PDV & Discount controls */}
              {isDraft && (
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                      estimate.pdv_enabled
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-muted/30"
                    }`}
                    onClick={() => handleMetaUpdate("pdv_enabled", estimate.pdv_enabled ? "0" : "1")}
                  >
                    <div>
                      <div className="text-sm font-medium">PDV</div>
                      <div className="text-xs text-muted-foreground">Porez 17%</div>
                    </div>
                    <Switch
                      checked={!!estimate.pdv_enabled}
                      onCheckedChange={(checked) => handleMetaUpdate("pdv_enabled", checked ? "1" : "0")}
                    />
                  </div>
                  <div className={`rounded-lg border px-4 py-3 transition-colors ${
                    estimate.discount_type !== "none"
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-muted/30"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Popust</div>
                      <Select
                        value={estimate.discount_type}
                        onValueChange={(v) => handleMetaUpdate("discount_type", v)}
                      >
                        <SelectTrigger className="h-7 w-auto gap-1 border-none bg-transparent px-2 text-xs text-muted-foreground shadow-none focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Bez popusta</SelectItem>
                          <SelectItem value="percentage">Postotak (%)</SelectItem>
                          <SelectItem value="amount">Fiksni iznos (KM)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {estimate.discount_type !== "none" ? (
                      <div className="flex items-center gap-2 mt-1">
                        <DecimalInput
                          className="h-7 text-sm text-right flex-1 bg-background/50"
                          value={estimate.discount_value}
                          onSave={(val) => handleMetaUpdate("discount_value", String(val))}
                        />
                        <span className="text-xs text-muted-foreground w-6 text-right">
                          {estimate.discount_type === "percentage" ? "%" : "KM"}
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground mt-1">Nije aktiviran</div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Library dialog */}
      <Dialog open={!!showLibrary} onOpenChange={(open) => !open && setShowLibrary(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Dodaj stavku iz biblioteke</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Pretrazi stavke..."
                value={libSearch}
                onChange={(e) => setLibSearch(e.target.value)}
                className="flex-1"
              />
              <Select value={libGroupFilter} onValueChange={setLibGroupFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sve grupe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Sve grupe</SelectItem>
                  {libraryGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              {filteredLibItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary cursor-pointer"
                  onClick={() => {
                    if (showLibrary) {
                      handleAddFromLibrary(showLibrary.groupId, item);
                      setShowLibrary(null);
                    }
                  }}
                >
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">{item.description}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div>{item.unit_price.toFixed(2)} KM/{item.unit}</div>
                  </div>
                </div>
              ))}
              {filteredLibItems.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Nema stavki</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {calcDrawer && (
        <CalculationDrawer
          open={!!calcDrawer}
          onClose={() => setCalcDrawer(null)}
          itemId={calcDrawer.itemId}
          itemName={calcDrawer.itemName}
          unit={calcDrawer.unit}
          currentQuantity={calcDrawer.quantity}
          isDraft={isDraft}
          onApplied={load}
        />
      )}

      {/* Adjust dialog */}
      <Dialog open={showAdjust} onOpenChange={setShowAdjust}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">Korekcija</DialogTitle>
            </DialogHeader>
          </div>

          <div className="px-6 space-y-5 pb-6">
            {/* Field toggle — segmented control */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Šta korigirati</Label>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-muted">
                <button
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-all ${
                    adjustField === "unit_price"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setAdjustField("unit_price")}
                >
                  Cijene
                </button>
                <button
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-all ${
                    adjustField === "quantity"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setAdjustField("quantity")}
                >
                  Količine
                </button>
              </div>
            </div>

            {/* Scope */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Opseg</Label>
              <Select value={adjustGroupId} onValueChange={setAdjustGroupId}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Cijeli predmjer</SelectItem>
                  {estimate.groups.map((g) => (
                    <SelectItem key={g.id} value={g.id.toString()}>{g.group_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Percentage — prominent input */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Postotak</Label>
              <div className="relative">
                <Input
                  value={adjustPercent}
                  onChange={(e) => setAdjustPercent(e.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                  autoFocus
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdjust(); }}
                  className="h-12 text-xl font-semibold text-right pr-10 tabular-nums"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground font-medium">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                npr. <span className="font-medium text-emerald-600">+10</span> povećava, <span className="font-medium text-red-500">-5</span> smanjuje
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/30">
            <Button variant="ghost" size="sm" onClick={() => setShowAdjust(false)}>Odustani</Button>
            <Button size="sm" onClick={handleAdjust}>Primijeni korekciju</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
