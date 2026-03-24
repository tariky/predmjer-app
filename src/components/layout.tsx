import { useState, type ReactNode } from "react";
import { useAuth } from "../lib/auth-context";
import { api } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "./ui/dialog";
import {
  LayoutDashboard,
  Library,
  Building2,
  Users,
  LogOut,
  HardHat,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";

type Route =
  | { page: "dashboard" }
  | { page: "estimate"; id: number }
  | { page: "library" }
  | { page: "admin-companies" }
  | { page: "admin-users" };

type Props = {
  route: Route;
  onNavigate: (route: Route) => void;
  children: ReactNode;
};

export function Layout({ route, onNavigate, children }: Props) {
  const { user, logout } = useAuth();

  const navItems = [
    { page: "dashboard" as const, label: "Predmjeri", icon: LayoutDashboard },
    { page: "library" as const, label: "Biblioteka", icon: Library },
  ];

  const adminItems = [
    { page: "admin-companies" as const, label: "Kompanije", icon: Building2 },
    { page: "admin-users" as const, label: "Korisnici", icon: Users },
  ];

  const [showPassword, setShowPassword] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.newPw) return;
    if (pwForm.newPw !== pwForm.confirm) {
      toast.error("Nova lozinka i potvrda se ne poklapaju");
      return;
    }
    setPwLoading(true);
    try {
      await api.post("/api/auth/change-password", {
        current_password: pwForm.current,
        new_password: pwForm.newPw,
      });
      toast.success("Lozinka uspješno promijenjena");
      setShowPassword(false);
      setPwForm({ current: "", newPw: "", confirm: "" });
    } catch {} finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <HardHat className="w-6 h-6 text-primary" />
            <span className="font-bold text-sidebar-foreground">Predmjer</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.page}
              variant={route.page === item.page ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => onNavigate({ page: item.page })}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Button>
          ))}

          {user?.role === "super_admin" && (
            <>
              <div className="pt-4 pb-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Admin
              </div>
              {adminItems.map((item) => (
                <Button
                  key={item.page}
                  variant={route.page === item.page ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2"
                  onClick={() => onNavigate({ page: item.page })}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              ))}
            </>
          )}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-1">
          <div className="text-sm text-sidebar-foreground mb-2 px-2 truncate">
            {user?.display_name}
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={() => setShowPassword(true)}
          >
            <KeyRound className="w-4 h-4" />
            Promijeni lozinku
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
            Odjavi se
          </Button>
        </div>
      </aside>

      {/* Change password dialog */}
      <Dialog open={showPassword} onOpenChange={(open) => {
        setShowPassword(open);
        if (!open) setPwForm({ current: "", newPw: "", confirm: "" });
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Promijeni lozinku</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Trenutna lozinka</Label>
              <Input
                type="password"
                value={pwForm.current}
                onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Nova lozinka</Label>
              <Input
                type="password"
                value={pwForm.newPw}
                onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Potvrdi novu lozinku</Label>
              <Input
                type="password"
                value={pwForm.confirm}
                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") handleChangePassword(); }}
              />
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={pwLoading || !pwForm.current || !pwForm.newPw || !pwForm.confirm}
              className="w-full"
            >
              {pwLoading ? "Mijenjanje..." : "Promijeni lozinku"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
