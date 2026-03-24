import type { ReactNode } from "react";
import { useAuth } from "../lib/auth-context";
import { SubscriptionExpired } from "./subscription-expired";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isSubscriptionExpired } = useAuth();

  if (isSubscriptionExpired) {
    return <SubscriptionExpired />;
  }

  return <>{children}</>;
}
