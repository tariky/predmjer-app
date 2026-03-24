import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Plus, Copy, FileDown, FileSpreadsheet, Trash2, Search } from "lucide-react";

type Estimate = {
  id: number;
  name: string;
  client_name: string;
  location: string;
  status: "draft" | "finished";
  created_by_name: string;
  created_at: string;
  updated_at: string;
};

export function Dashboard({ onOpenEstimate }: { onOpenEstimate: (id: number) => void }) {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newClient, setNewClient] = useState("");
  const [newLocation, setNewLocation] = useState("");

  const load = async () => {
    try {
      const data = await api.get<Estimate[]>("/api/estimates");
      setEstimates(data);
    } catch (e) {
      console.error("Failed to load estimates:", e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = estimates.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.client_name.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const est = await api.post<Estimate>("/api/estimates", {
      name: newName,
      client_name: newClient,
      location: newLocation,
    });
    setShowNew(false);
    setNewName("");
    setNewClient("");
    setNewLocation("");
    onOpenEstimate(est.id);
  };

  const handleDuplicate = async (id: number) => {
    const est = await api.post<Estimate>(`/api/estimates/${id}/duplicate`);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Da li ste sigurni da zelite obrisati ovaj predmjer?")) return;
    await api.delete(`/api/estimates/${id}`);
    load();
  };

  const handleExportPdf = (id: number) => {
    window.open(`/api/estimates/${id}/export/pdf`, "_blank");
  };

  const handleExportExcel = (id: number) => {
    window.open(`/api/estimates/${id}/export/excel`, "_blank");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Predmjeri i predracuni</h1>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novi predmjer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novi predmjer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Naziv</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Naziv predmjera" autoFocus />
              </div>
              <div className="space-y-2">
                <Label>Investitor</Label>
                <Input value={newClient} onChange={(e) => setNewClient(e.target.value)} placeholder="Naziv investitora" />
              </div>
              <div className="space-y-2">
                <Label>Lokacija</Label>
                <Input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Lokacija projekta" />
              </div>
              <Button onClick={handleCreate} className="w-full">Kreiraj</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Pretrazi predmjere..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naziv</TableHead>
              <TableHead>Investitor</TableHead>
              <TableHead>Lokacija</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Kreirao</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead className="text-right">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {estimates.length === 0 ? "Nemate predmjera. Kreirajte prvi!" : "Nema rezultata pretrage."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((est) => (
                <TableRow
                  key={est.id}
                  className="cursor-pointer"
                  onClick={() => onOpenEstimate(est.id)}
                >
                  <TableCell className="font-medium">{est.name}</TableCell>
                  <TableCell>{est.client_name}</TableCell>
                  <TableCell>{est.location}</TableCell>
                  <TableCell>
                    <Badge variant={est.status === "finished" ? "default" : "secondary"}>
                      {est.status === "finished" ? "Zavrsen" : "Nacrt"}
                    </Badge>
                  </TableCell>
                  <TableCell>{est.created_by_name}</TableCell>
                  <TableCell>{new Date(est.updated_at).toLocaleDateString("bs-BA")}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleDuplicate(est.id)} title="Kopiraj">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleExportPdf(est.id)} title="PDF">
                        <FileDown className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleExportExcel(est.id)} title="Excel">
                        <FileSpreadsheet className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(est.id)} title="Obrisi">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
