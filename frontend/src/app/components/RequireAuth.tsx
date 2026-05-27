import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/context/useAuth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, status } = useAuth();
  const location = useLocation();

  if (status === "initializing") {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading secure session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return children;
}