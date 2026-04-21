import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartment } from "@/contexts/DepartmentContext";

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, isAdminFor } = useAuth();
  const { department } = useDepartment();
  const navigate = useNavigate();

  const allowed = !!user && isAdminFor(department);

  useEffect(() => {
    if (user && !allowed) {
      toast.error("Access denied — admin only");
      navigate("/", { replace: true });
    }
  }, [allowed, user, navigate]);

  if (!allowed) return null;
  return <>{children}</>;
}