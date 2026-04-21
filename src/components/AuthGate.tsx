import { useAuth } from "@/contexts/AuthContext";
import LoginScreen from "@/components/LoginScreen";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="flex min-h-[100dvh] items-center justify-center bg-background" />;
  }
  if (!user) return <LoginScreen />;
  return <>{children}</>;
}