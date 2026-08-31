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
import { Loader2, Plus, Trash2, KeyRound, Shield, User as UserIcon, Check, Ban, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth, type AppRole, type AppDepartment } from "@/contexts/AuthContext";

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrator",
  staff: "Personel",
  viewer: "Podgląd (prezentacja)",
};

const DEPT_LABELS: Record<AppDepartment, string> = {
  all: "Wszystkie działy",
  bar512: "Bar 512",
  konferencje: "Konferencje",
  polskie_smaki: "Polskie Smaki",
};

interface UserRow {
  id: string;
  username: string;
  role: AppRole;
  department: AppDepartment;
  approved: boolean;
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
      if (!me) throw new Error("Nie zalogowano");
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
      toast.success("Użytkownik utworzony");
    },
    onError: (err: any) => toast.error(err?.message ?? "Nie udało się utworzyć użytkownika"),
  });

  const updatePassword = useMutation({
    mutationFn: async () => {
      if (!me || !pwTarget) throw new Error("Brak celu");
      const { error } = await (supabase as any).rpc("admin_update_password", {
        _admin_id: me.id,
        _user_id: pwTarget.id,
        _new_password: pwValue,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setPwOpen(false); setPwTarget(null); setPwValue("");
      toast.success("Hasło zaktualizowane");
    },
    onError: (err: any) => toast.error(err?.message ?? "Nie udało się zaktualizować hasła"),
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, role, department }: { userId: string; role?: AppRole; department?: AppDepartment }) => {
      if (!me) throw new Error("Nie zalogowano");
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
      toast.success("Użytkownik zaktualizowany");
    },
    onError: (err: any) => toast.error(err?.message ?? "Nie udało się zaktualizować użytkownika"),
  });

  const setApproved = useMutation({
    mutationFn: async ({ userId, approved }: { userId: string; approved: boolean }) => {
      if (!me) throw new Error("Nie zalogowano");
      const { error } = await (supabase as any).rpc("admin_set_approved", {
        _admin_id: me.id,
        _user_id: userId,
        _approved: approved,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: QKEY });
      toast.success(vars.approved ? "Dostęp zatwierdzony" : "Dostęp cofnięty");
    },
    onError: (err: any) => toast.error(err?.message ?? "Nie udało się zaktualizować dostępu"),
  });


  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      if (!me) throw new Error("Nie zalogowano");
      const { error } = await (supabase as any).rpc("admin_delete_user", {
        _admin_id: me.id,
        _user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY });
      toast.success("Użytkownik usunięty");
    },
    onError: (err: any) => toast.error(err?.message ?? "Nie udało się usunąć użytkownika"),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Zarządzaj tym, kto może się zalogować i co może robić.</p>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Dodaj użytkownika
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Brak użytkowników</p>
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
                  ) : u.role === "viewer" ? (
                    <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <UserIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {u.username}
                      {isMe && <span className="text-xs text-muted-foreground ml-2">(ty)</span>}
                      {!u.approved && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-destructive/50 bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-destructive align-middle">
                          <Clock className="h-3 w-3" /> Oczekujący
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span>{ROLE_LABELS[u.role] ?? u.role}</span>
                      <span> · {DEPT_LABELS[u.department ?? "all"]}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                  {!isMe && (
                    <Button
                      size="sm"
                      variant={u.approved ? "ghost" : "default"}
                      className="h-8 gap-1.5 text-xs"
                      title={u.approved ? "Cofnij dostęp" : "Zatwierdź dostęp"}
                      onClick={() => setApproved.mutate({ userId: u.id, approved: !u.approved })}
                    >
                      {u.approved ? <Ban className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                      {u.approved ? "Cofnij" : "Zatwierdź"}
                    </Button>
                  )}

                  <Select
                    value={u.role}
                    onValueChange={(v) => updateRole.mutate({ userId: u.id, role: v as AppRole })}
                  >
                    <SelectTrigger className="h-8 w-[100px] text-xs bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Personel</SelectItem>
                      <SelectItem value="viewer">Podgląd</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
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
                      <SelectItem value="all">Wszystkie działy</SelectItem>
                      <SelectItem value="bar512">Bar 512</SelectItem>
                      <SelectItem value="konferencje">Konferencje</SelectItem>
                      <SelectItem value="polskie_smaki">Polskie Smaki</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary h-8 w-8"
                    title="Zmień hasło"
                    onClick={() => { setPwTarget(u); setPwValue(""); setPwOpen(true); }}
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                    title="Usuń użytkownika"
                    disabled={isMe}
                    onClick={() => {
                      if (window.confirm(`Usunąć użytkownika "${u.username}"?`)) deleteUser.mutate(u.id);
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
            <DialogTitle className="font-heading text-foreground">Dodaj użytkownika</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nazwa użytkownika</Label>
              <Input
                placeholder="np. jkowalski"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                autoCapitalize="none"
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Hasło</Label>
              <Input
                type="password"
                placeholder="Co najmniej 4 znaki"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Rola</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Personel (codzienna praca)</SelectItem>
                  <SelectItem value="viewer">Podgląd / prezentacja (bez zmian)</SelectItem>
                  <SelectItem value="admin">Administrator (pełny dostęp)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Dział</Label>
              <Select value={newDepartment} onValueChange={(v) => setNewDepartment(v as AppDepartment)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie działy</SelectItem>
                  <SelectItem value="bar512">Bar 512</SelectItem>
                  <SelectItem value="konferencje">Konferencje</SelectItem>
                  <SelectItem value="polskie_smaki">Polskie Smaki</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Administratorzy ograniczeni do jednego działu zarządzają tylko tym działem.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Anuluj</Button>
            <Button
              onClick={() => createUser.mutate()}
              disabled={!newUsername.trim() || newPassword.length < 4 || createUser.isPending}
            >
              {createUser.isPending ? "Tworzenie…" : "Utwórz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change password dialog */}
      <Dialog open={pwOpen} onOpenChange={(v) => { setPwOpen(v); if (!v) { setPwTarget(null); setPwValue(""); } }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">
              Zmień hasło{pwTarget ? ` — ${pwTarget.username}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              type="password"
              placeholder="Nowe hasło (min. 4 znaki)"
              value={pwValue}
              onChange={(e) => setPwValue(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)}>Anuluj</Button>
            <Button
              onClick={() => updatePassword.mutate()}
              disabled={pwValue.length < 4 || updatePassword.isPending}
            >
              {updatePassword.isPending ? "Zapisywanie…" : "Zaktualizuj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}