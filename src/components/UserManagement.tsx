import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, KeyRound, Shield, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth, type AppRole, type AppDepartment } from "@/contexts/AuthContext";

const DEPT_LABELS: Record<AppDepartment, string> = {
  all: "All Departments",
  bar512: "Bar 512",
  konferencje: "Konferencje",
  polskie_smaki: "Polskie Smaki",
};

interface UserRow {
  id: string;
  username: string;
  role: AppRole;
  department: AppDepartment;
  created_at: string;
}

const QKEY = ["app-users"];

export default function UserManagement() {
  const qc = useQueryClient();
  const { user: me } = useAuth();

  const [createOpen, setCreateOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("staff");
  const [newDepartment, setNewDepartment] = useState<AppDepartment>("all");

  const [pwOpen, setPwOpen] = useState(false);
  const [pwTarget, setPwTarget] = useState<UserRow | null>(null);
  const [pwValue, setPwValue] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: QKEY,
    queryFn: async () => {
      if (!me) return [];
      const { data, error } = await (supabase as any).rpc("admin_list_users", { _admin_id: me.id });
      if (error) throw error;
      return (data ?? []) as UserRow[];
    },
    enabled: !!me,
  });

  // Realtime: refresh user list when app_users changes (insert/update/delete)
  useEffect(() => {
    const channel = supabase
      .channel("app-users-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_users" },
        () => qc.invalidateQueries({ queryKey: QKEY }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const createUser = useMutation({
    mutationFn: async () => {
      if (!me) throw new Error("Not signed in");
      const { error } = await (supabase as any).rpc("admin_create_user", {
        _admin_id: me.id,
        _username: newUsername.trim(),
        _password: newPassword,
        _role: newRole,
        _department: newDepartment,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY });
      setCreateOpen(false);
      setNewUsername(""); setNewPassword(""); setNewRole("staff"); setNewDepartment("all");
      toast.success("User created");
    },
    onError: (err: any) => toast.error(err?.message ?? "Failed to create user"),
  });

  const updatePassword = useMutation({
    mutationFn: async () => {
      if (!me || !pwTarget) throw new Error("Missing target");
      const { error } = await (supabase as any).rpc("admin_update_password", {
        _admin_id: me.id,
        _user_id: pwTarget.id,
        _new_password: pwValue,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setPwOpen(false); setPwTarget(null); setPwValue("");
      toast.success("Password updated");
    },
    onError: (err: any) => toast.error(err?.message ?? "Failed to update password"),
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, role, department }: { userId: string; role?: AppRole; department?: AppDepartment }) => {
      if (!me) throw new Error("Not signed in");
      // Find current values to fill in the unchanged side
      const current = users.find((u) => u.id === userId);
      const nextRole: AppRole = role ?? current?.role ?? "staff";
      const nextDept: AppDepartment = department ?? current?.department ?? "all";
      const { error } = await (supabase as any).rpc("admin_update_role", {
        _admin_id: me.id,
        _user_id: userId,
        _new_role: nextRole,
        _new_department: nextDept,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY });
      toast.success("User updated");
    },
    onError: (err: any) => toast.error(err?.message ?? "Failed to update user"),
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      if (!me) throw new Error("Not signed in");
      const { error } = await (supabase as any).rpc("admin_delete_user", {
        _admin_id: me.id,
        _user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY });
      toast.success("User deleted");
    },
    onError: (err: any) => toast.error(err?.message ?? "Failed to delete user"),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Manage who can sign in and what they can do.</p>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No users</p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => {
            const isMe = u.id === me?.id;
            return (
              <div
                key={u.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/50 px-3 py-2"
              >
                <div className="min-w-0 flex-1 flex items-center gap-2">
                  {u.role === "admin" ? (
                    <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                  ) : (
                    <UserIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {u.username}
                      {isMe && <span className="text-xs text-muted-foreground ml-2">(you)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="capitalize">{u.role}</span>
                      <span> · {DEPT_LABELS[u.department ?? "all"]}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                  <Select
                    value={u.role}
                    onValueChange={(v) => updateRole.mutate({ userId: u.id, role: v as AppRole })}
                  >
                    <SelectTrigger className="h-8 w-[100px] text-xs bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={u.department ?? "all"}
                    onValueChange={(v) => updateRole.mutate({ userId: u.id, department: v as AppDepartment })}
                  >
                    <SelectTrigger className="h-8 w-[140px] text-xs bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="bar512">Bar 512</SelectItem>
                      <SelectItem value="konferencje">Konferencje</SelectItem>
                      <SelectItem value="polskie_smaki">Polskie Smaki</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary h-8 w-8"
                    title="Change password"
                    onClick={() => { setPwTarget(u); setPwValue(""); setPwOpen(true); }}
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                    title="Delete user"
                    disabled={isMe}
                    onClick={() => {
                      if (window.confirm(`Delete user "${u.username}"?`)) deleteUser.mutate(u.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create user dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">Add User</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Username</Label>
              <Input
                placeholder="e.g. jdoe"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                autoCapitalize="none"
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
              <Input
                type="password"
                placeholder="At least 4 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff (view only)</SelectItem>
                  <SelectItem value="admin">Admin (full access)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createUser.mutate()}
              disabled={!newUsername.trim() || newPassword.length < 4 || createUser.isPending}
            >
              {createUser.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change password dialog */}
      <Dialog open={pwOpen} onOpenChange={(v) => { setPwOpen(v); if (!v) { setPwTarget(null); setPwValue(""); } }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">
              Change password{pwTarget ? ` — ${pwTarget.username}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              type="password"
              placeholder="New password (min 4 chars)"
              value={pwValue}
              onChange={(e) => setPwValue(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)}>Cancel</Button>
            <Button
              onClick={() => updatePassword.mutate()}
              disabled={pwValue.length < 4 || updatePassword.isPending}
            >
              {updatePassword.isPending ? "Saving…" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}