import { useAuth } from "../lib/auth-context";
import { Button } from "./ui/button";
import { AlertTriangle } from "lucide-react";

export function SubscriptionExpired() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Pretplata je istekla
        </h1>
        <p className="text-muted-foreground">
          Vasa pretplata je istekla. Molimo izvrsите uplatu kako ne biste izgubili pristup.
          Kontaktirajte administratora za vise informacija o produzenju pretplate.
        </p>
        <Button variant="outline" onClick={logout}>
          Odjavi se
        </Button>
      </div>
    </div>
  );
}
