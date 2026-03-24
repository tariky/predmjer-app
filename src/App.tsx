import { useState } from "react";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { LoginPage } from "./pages/login";
import { Dashboard } from "./pages/dashboard";
import { EstimateEditor } from "./pages/estimate-editor";
import { Library } from "./pages/library";
import { AdminCompanies } from "./pages/admin-companies";
import { AdminUsers } from "./pages/admin-users";
import { Layout } from "./components/layout";
import { ProtectedRoute } from "./components/protected-route";
import { Toaster } from "./components/ui/sonner";
import "./index.css";

type Route =
  | { page: "dashboard" }
  | { page: "estimate"; id: number }
  | { page: "library" }
  | { page: "admin-companies" }
  | { page: "admin-users" };

function Router() {
  const { user, loading } = useAuth();
  const [route, setRoute] = useState<Route>({ page: "dashboard" });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Ucitavanje...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Reset to dashboard if non-admin lands on admin page
  const isAdminPage = route.page === "admin-companies" || route.page === "admin-users";
  const currentRoute = isAdminPage && user.role !== "super_admin" ? { page: "dashboard" as const } : route;

  return (
    <ProtectedRoute>
      <Layout route={currentRoute} onNavigate={setRoute}>
        {currentRoute.page === "dashboard" && <Dashboard onOpenEstimate={(id) => setRoute({ page: "estimate", id })} />}
        {currentRoute.page === "estimate" && <EstimateEditor id={(currentRoute as any).id} onBack={() => setRoute({ page: "dashboard" })} />}
        {currentRoute.page === "library" && <Library />}
        {currentRoute.page === "admin-companies" && <AdminCompanies />}
        {currentRoute.page === "admin-users" && <AdminUsers />}
      </Layout>
    </ProtectedRoute>
  );
}

export function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster />
    </AuthProvider>
  );
}
