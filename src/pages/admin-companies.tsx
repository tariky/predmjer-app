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
import { Plus, Pencil, Trash2, AlertTriangle, CheckCircle } from "lucide-react";

type Company = {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string | null;
  subscription_expires_at: string | null;
  created_at: string;
};

export function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "", subscription_expires_at: "" });

  const load = async () => {
    const data = await api.get<Company[]>("/api/admin/companies");
    setCompanies(data);
  };

  useEffect(() => { load(); }, []);

  const isExpired = (date: string | null) => {
    if (!date) return true;
    return new Date(date) < new Date();
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", address: "", phone: "", email: "", subscription_expires_at: "" });
    setShowDialog(true);
  };

  const openEdit = (company: Company) => {
    setEditing(company);
    setForm({
      name: company.name,
      address: company.address,
      phone: company.phone,
      email: company.email,
      subscription_expires_at: company.subscription_expires_at?.split("T")[0] || "",
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const payload = {
      ...form,
      subscription_expires_at: form.subscription_expires_at
        ? new Date(form.subscription_expires_at).toISOString()
        : null,
    };
    if (editing) {
      await api.put(`/api/admin/companies/${editing.id}`, payload);
    } else {
      await api.post("/api/admin/companies", payload);
    }
    setShowDialog(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Da li ste sigurni? Ovo ce obrisati kompaniju i sve njene podatke.")) return;
    await api.delete(`/api/admin/companies/${id}`);
    load();
  };

  const handleLogoUpload = async (companyId: number, file: File) => {
    const formData = new FormData();
    formData.append("logo", file);
    await api.upload(`/api/admin/companies/${companyId}/logo`, formData);
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kompanije</h1>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Nova kompanija
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naziv</TableHead>
              <TableHead>Adresa</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Pretplata</TableHead>
              <TableHead className="text-right">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {company.logo_url && (
                      <img src={company.logo_url} alt="" className="w-6 h-6 rounded object-cover" />
                    )}
                    {company.name}
                  </div>
                </TableCell>
                <TableCell>{company.address}</TableCell>
                <TableCell>{company.phone}</TableCell>
                <TableCell>{company.email}</TableCell>
                <TableCell>
                  {company.subscription_expires_at ? (
                    isExpired(company.subscription_expires_at) ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="w-3 h-3" /> Istekla
                      </Badge>
                    ) : (
                      <Badge variant="default" className="gap-1 bg-green-600">
                        <CheckCircle className="w-3 h-3" />
                        {new Date(company.subscription_expires_at).toLocaleDateString("bs-BA")}
                      </Badge>
                    )
                  ) : (
                    <Badge variant="secondary">Nije postavljena</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(company)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(company.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {companies.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nema kompanija
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Uredi kompaniju" : "Nova kompanija"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Naziv</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Adresa</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pretplata istice</Label>
              <Input
                type="date"
                value={form.subscription_expires_at}
                onChange={(e) => setForm({ ...form, subscription_expires_at: e.target.value })}
              />
            </div>
            {editing && (
              <div className="space-y-2">
                <Label>Logo</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && editing) handleLogoUpload(editing.id, file);
                  }}
                />
              </div>
            )}
            <Button onClick={handleSave} className="w-full">Sacuvaj</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
