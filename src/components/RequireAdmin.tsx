import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isAdmin) {
      toast.error("Access denied — admin only");
      navigate("/", { replace: true });
    }
  }, [isAdmin, user, navigate]);

  if (!user || !isAdmin) return null;
  return <>{children}</>;
}