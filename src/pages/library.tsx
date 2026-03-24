import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { UNITS } from "../lib/units";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { cn } from "../lib/utils";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Plus, Pencil, Trash2, Lock, FolderOpen, Eye, EyeOff, Search, Package } from "lucide-react";
import { AiDescriptionButton } from "../components/ai-description-button";

type ItemGroup = {
  id: number;
  name: string;
  created_by: number | null;
  created_by_name: string | null;
};

type LibraryItem = {
  id: number;
  group_id: number;
  name: string;
  description: string;
  unit: string;
  unit_price: number;
  created_by: number | null;
  created_by_name: string | null;
};

export function Library() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<ItemGroup[]>([]);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ItemGroup | null>(null);
  const [groupName, setGroupName] = useState("");
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
  const [itemForm, setItemForm] = useState({ name: "", description: "", unit: "", unit_price: 0 });
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");

  const loadHiddenIds = async () => {
    try {
      const ids = await api.get<number[]>("/api/library-items/hidden");
      setHiddenIds(new Set(ids));
    } catch {}
  };

  const toggleHidden = async (itemId: number) => {
    try {
      const res = await api.post<{ hidden: boolean }>(`/api/library-items/${itemId}/toggle-hidden`);
      setHiddenIds((prev) => {
        const next = new Set(prev);
        if (res.hidden) next.add(itemId);
        else next.delete(itemId);
        return next;
      });
    } catch {}
  };

  const loadGroups = async () => {
    try {
      const data = await api.get<ItemGroup[]>("/api/item-groups");
      setGroups(data);
      if (!selectedGroup && data.length > 0) setSelectedGroup(data[0].id);
    } catch (e) {
      console.error("Failed to load groups:", e);
    }
  };

  const loadItems = async (groupId: number) => {
    const data = await api.get<LibraryItem[]>(`/api/library-items?group_id=${groupId}`);
    setItems(data);
  };

  useEffect(() => { loadGroups(); loadHiddenIds(); }, []);
  useEffect(() => { if (selectedGroup) loadItems(selectedGroup); }, [selectedGroup]);

  const canEditGroup = (group: ItemGroup) => group.created_by === user?.id;
  const canEditItem = (item: LibraryItem) => item.created_by === user?.id;

  const handleSaveGroup = async () => {
    if (!groupName.trim()) return;
    if (editingGroup) {
      await api.put(`/api/item-groups/${editingGroup.id}`, { name: groupName });
    } else {
      await api.post("/api/item-groups", { name: groupName });
    }
    setShowGroupDialog(false);
    setEditingGroup(null);
    setGroupName("");
    loadGroups();
  };

  const handleDeleteGroup = async (id: number) => {
    if (!confirm("Obrisati grupu i sve stavke u njoj?")) return;
    await api.delete(`/api/item-groups/${id}`);
    if (selectedGroup === id) setSelectedGroup(null);
    loadGroups();
  };

  const handleSaveItem = async () => {
    if (!itemForm.name.trim() || !itemForm.unit.trim()) return;
    if (editingItem) {
      await api.put(`/api/library-items/${editingItem.id}`, itemForm);
    } else {
      await api.post("/api/library-items", { ...itemForm, group_id: selectedGroup });
    }
    setShowItemDialog(false);
    setEditingItem(null);
    setItemForm({ name: "", description: "", unit: "", unit_price: 0 });
    if (selectedGroup) loadItems(selectedGroup);
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm("Obrisati stavku?")) return;
    await api.delete(`/api/library-items/${id}`);
    if (selectedGroup) loadItems(selectedGroup);
  };

  const openEditGroup = (group: ItemGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setShowGroupDialog(true);
  };

  const openNewGroup = () => {
    setEditingGroup(null);
    setGroupName("");
    setShowGroupDialog(true);
  };

  const openEditItem = (item: LibraryItem) => {
    setEditingItem(item);
    setItemForm({ name: item.name, description: item.description, unit: item.unit, unit_price: item.unit_price });
    setShowItemDialog(true);
  };

  const openNewItem = () => {
    setEditingItem(null);
    setItemForm({ name: "", description: "", unit: "", unit_price: 0 });
    setShowItemDialog(true);
  };

  return (
    <div className="flex h-full">
      {/* Left sidebar - groups */}
      <div className="w-72 border-r border-border flex flex-col">
        <div className="flex items-center justify-between p-4 pb-2">
          <h2 className="font-semibold text-lg">Grupe stavki</h2>
          <Button variant="ghost" size="icon" onClick={openNewGroup}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
        {groups.map((group) => (
          <div
            key={group.id}
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-secondary group",
              selectedGroup === group.id && "bg-secondary"
            )}
            onClick={() => setSelectedGroup(group.id)}
          >
            {group.created_by === null ? (
              <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            ) : (
              <FolderOpen className="w-3 h-3 text-primary flex-shrink-0" />
            )}
            <span className="flex-1 text-sm truncate">{group.name}</span>
            {canEditGroup(group) && (
              <div className="hidden group-hover:flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); openEditGroup(group); }}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            )}
          </div>
        ))}
        </div>
      </div>

      {/* Right panel - items */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedGroup ? (
          <>
            {/* Sticky header */}
            <div className="p-5 pb-0 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{groups.find((g) => g.id === selectedGroup)?.name}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{items.length} stavki</p>
                </div>
                <Button onClick={openNewItem} size="sm">
                  <Plus className="w-4 h-4 mr-1.5" /> Nova stavka
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pretrazi stavke..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Scrollable item list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              {items
                .filter((item) =>
                  !search.trim() ||
                  item.name.toLowerCase().includes(search.toLowerCase()) ||
                  item.description.toLowerCase().includes(search.toLowerCase())
                )
                .map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "group rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/30",
                    hiddenIds.has(item.id) && "opacity-40 border-dashed"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm truncate">{item.name}</h3>
                        {item.created_by === null && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
                            <Lock className="w-2.5 h-2.5 mr-0.5" /> Sistem
                          </Badge>
                        )}
                        {hiddenIds.has(item.id) && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0 border-dashed text-muted-foreground">
                            <EyeOff className="w-2.5 h-2.5 mr-0.5" /> Skrivena
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.description}</p>
                      )}
                    </div>

                    {/* Meta + Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">{item.unit}</div>
                        <div className="text-sm font-mono font-medium">{item.unit_price.toFixed(2)}</div>
                      </div>

                      <Separator orientation="vertical" className="h-8" />

                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleHidden(item.id)}
                          title={hiddenIds.has(item.id) ? "Prikazi u predmjeru" : "Sakrij iz predmjera"}
                        >
                          {hiddenIds.has(item.id) ? (
                            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        {canEditItem(item) && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditItem(item)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteItem(item.id)}>
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Package className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">Nema stavki u ovoj grupi</p>
                  <Button variant="link" size="sm" className="mt-1" onClick={openNewItem}>Dodaj prvu stavku</Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Package className="w-12 h-12 mb-3 opacity-20" />
            <p>Odaberi grupu sa lijeve strane</p>
          </div>
        )}
      </div>

      {/* Group dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGroup ? "Uredi grupu" : "Nova grupa"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Naziv grupe</Label>
              <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} autoFocus />
            </div>
            <Button onClick={handleSaveGroup} className="w-full">Sacuvaj</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Item dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Uredi stavku" : "Nova stavka"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Naziv</Label>
              <Input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} autoFocus />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Opis</Label>
                <AiDescriptionButton onResult={({ name, description }) => setItemForm({ ...itemForm, ...(name && { name }), description })} />
              </div>
              <Textarea value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jedinica mjere</Label>
                <Select value={itemForm.unit || "kom"} onValueChange={(v) => setItemForm({ ...itemForm, unit: v })}>
                  <SelectTrigger><SelectValue placeholder="Odaberi..." /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jedinicna cijena</Label>
                <Input type="number" step="0.01" value={itemForm.unit_price} onChange={(e) => setItemForm({ ...itemForm, unit_price: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <Button onClick={handleSaveItem} className="w-full">Sacuvaj</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
