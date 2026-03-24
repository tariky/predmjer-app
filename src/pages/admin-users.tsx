import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "../components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";

type User = {
  id: number;
  username: string;
  display_name: string;
  role: string;
  company_id: number | null;
  company_name: string | null;
  created_at: string;
};

type Company = {
  id: number;
  name: string;
};

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    display_name: "",
    role: "user",
    company_id: "",
  });

  const load = async () => {
    const [usersData, companiesData] = await Promise.all([
      api.get<User[]>("/api/admin/users"),
      api.get<Company[]>("/api/admin/companies"),
    ]);
    setUsers(usersData);
    setCompanies(companiesData);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ username: "", password: "", display_name: "", role: "user", company_id: "" });
    setShowDialog(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({
      username: user.username,
      password: "",
      display_name: user.display_name,
      role: user.role,
      company_id: user.company_id?.toString() || "",
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.display_name.trim()) return;
    const payload: any = {
      display_name: form.display_name,
      role: form.role,
      company_id: form.company_id ? parseInt(form.company_id) : null,
    };

    if (editing) {
      if (form.password) payload.password = form.password;
      await api.put(`/api/admin/users/${editing.id}`, payload);
    } else {
      if (!form.username.trim() || !form.password.trim()) return;
      payload.username = form.username;
      payload.password = form.password;
      await api.post("/api/admin/users", payload);
    }
    setShowDialog(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Da li ste sigurni da zelite obrisati ovog korisnika?")) return;
    await api.delete(`/api/admin/users/${id}`);
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Korisnici</h1>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Novi korisnik
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Korisnicko ime</TableHead>
              <TableHead>Ime</TableHead>
              <TableHead>Uloga</TableHead>
              <TableHead>Kompanija</TableHead>
              <TableHead>Datum kreiranja</TableHead>
              <TableHead className="text-right">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.display_name}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "super_admin" ? "default" : "secondary"}>
                    {user.role === "super_admin" ? "Admin" : "Korisnik"}
                  </Badge>
                </TableCell>
                <TableCell>{user.company_name || "—"}</TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString("bs-BA")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nema korisnika
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Uredi korisnika" : "Novi korisnik"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Korisnicko ime</Label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                disabled={!!editing}
                autoFocus={!editing}
              />
            </div>
            <div className="space-y-2">
              <Label>{editing ? "Nova lozinka (ostavi prazno za bez promjene)" : "Lozinka"}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Ime i prezime</Label>
              <Input
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Uloga</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Korisnik</SelectItem>
                    <SelectItem value="super_admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kompanija</Label>
                <Select value={form.company_id || "none"} onValueChange={(v) => setForm({ ...form, company_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Odaberi..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Bez kompanije</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSave} className="w-full">Sacuvaj</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
