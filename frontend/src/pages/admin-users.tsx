import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Edit2, RefreshCw } from "lucide-react";
import { api } from "@/services/apiClient";

// ── Types ─────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  accountStatus: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  xp: number;
  streak: number;
}

const ROLES = ["USER", "ADMIN", "STUDENT", "RECRUITER", "PLACEMENT_OFFICER"] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getRoleColor(role: string) {
  switch (role) {
    case "ADMIN":           return "bg-red-100 text-red-800";
    case "STUDENT":         return "bg-blue-100 text-blue-800";
    case "RECRUITER":       return "bg-green-100 text-greeneen-800";
    case "PLACEMENT_OFFICER": return "bg-yellow-100 text-yellow-800";
    default:                return "bg-gray-100 text-gray-800";
  }
}

function getStatusColor(isActive: boolean) {
  return isActive
    ? "bg-green-100 text-green-800"
    : "bg-red-100 text-red-800";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminUsers() {
  const [users, setUsers]           = useState<User[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingRole, setEditingRole] = useState<{ id: string; role: string } | null>(null);
  const [saving, setSaving]         = useState<string | null>(null);
  const [blocking, setBlocking]     = useState<string | null>(null);

  // ── fetch ──
  async function loadUsers() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.get<User[]>("/admin/users");
      setUsers(data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  // ── verify email ──
  // ── block user ──
  async function blockUser(userId: string) {
    setBlocking(userId);
    try {
      await api.post(`/admin/users/${userId}/block`, {});
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: false, accountStatus: "SUSPENDED" } : u))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to block user");
    } finally {
      setBlocking(null);
    }
  }

  // ── unblock user ──
  async function unblockUser(userId: string) {
    setBlocking(userId);
    try {
      await api.post(`/admin/users/${userId}/unblock`, {});
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: true, accountStatus: "ACTIVE" } : u))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to unblock user");
    } finally {
      setBlocking(null);
    }
  }

  // ── role change ──
  async function saveRole(userId: string, newRole: string) {
    setSaving(userId);
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setEditingRole(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setSaving(null);
    }
  }

  // ── filtered lists ──
  const unverifiedUsers = useMemo(() =>
    users.filter(u => !u.emailVerified && u.isActive &&
      (u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
       u.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [users, searchTerm]
  );

  const verifiedUsers = useMemo(() =>
    users.filter(u => u.emailVerified && u.isActive &&
      (u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
       u.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [users, searchTerm]
  );

  const blockedUsers = useMemo(() =>
    users.filter(u => !u.isActive &&
      (u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
       u.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [users, searchTerm]
  );

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-2">Manage platform users and their roles</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
          <button className="ml-4 underline" onClick={loadUsers}>Retry</button>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                {isLoading ? "Loading…" : `${users.length} total users`}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={loadUsers} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by email or name…"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* SECTION 1: EMAIL VERIFICATION PENDING */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-orange-500 rounded"></div>
                <h3 className="text-lg font-semibold">Email Verification Pending</h3>
                <span className="ml-auto bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                  {unverifiedUsers.length}
                </span>
              </div>

              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Email</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Name</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Role</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Status</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} className="border-t">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <td key={j} className="px-2 sm:px-4 py-2 sm:py-3">
                              <div className="h-4 bg-muted animate-pulse rounded w-20" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : unverifiedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-2 sm:px-4 py-4 sm:py-8 text-center text-muted-foreground">
                          No users waiting for email verification
                        </td>
                      </tr>
                    ) : (
                      unverifiedUsers.map((user) => (
                        <tr key={user.id} className="border-t hover:bg-muted/50">
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-muted-foreground truncate">{user.email}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium truncate">{user.fullName}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(user.isActive)}`}>
                              {user.accountStatus === "EMAIL_PENDING" ? "email pending" : user.accountStatus.toLowerCase()}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-muted-foreground text-xs">{formatDate(user.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 2: VERIFIED USERS */}
            <div className="space-y-4 mt-8 pt-8 border-t">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-green-500 rounded"></div>
                <h3 className="text-lg font-semibold">Verified Users</h3>
                <span className="ml-auto bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {verifiedUsers.length}
                </span>
              </div>

              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Email</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Name</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Role</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Status</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">XP</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Joined</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} className="border-t">
                          {Array.from({ length: 7 }).map((_, j) => (
                            <td key={j} className="px-2 sm:px-4 py-2 sm:py-3">
                              <div className="h-4 bg-muted animate-pulse rounded w-20" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : verifiedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-2 sm:px-4 py-4 sm:py-8 text-center text-muted-foreground">
                          No verified users yet
                        </td>
                      </tr>
                    ) : (
                      verifiedUsers.map((user) => (
                        <tr key={user.id} className="border-t hover:bg-muted/50">
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-muted-foreground truncate text-xs">{user.email}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium truncate">{user.fullName}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            {editingRole?.id === user.id ? (
                              <div className="flex items-center gap-1">
                                <select
                                  aria-label={`Role for ${user.fullName}`}
                                  className="text-xs border rounded px-1 py-0.5"
                                  value={editingRole.role}
                                  onChange={(e) =>
                                    setEditingRole({ id: user.id, role: e.target.value })
                                  }
                                >
                                  {ROLES.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                  ))}
                                </select>
                                <Button
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  disabled={saving === user.id}
                                  onClick={() => saveRole(user.id, editingRole.role)}
                                >
                                  {saving === user.id ? "…" : "Save"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => setEditingRole(null)}
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
                                {user.role}
                              </span>
                            )}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(user.isActive)}`}>
                              {user.isActive ? "active" : "inactive"}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-muted-foreground">{user.xp}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-muted-foreground text-xs">{formatDate(user.createdAt)}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Edit role"
                                onClick={() => setEditingRole({ id: user.id, role: user.role })}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              {user.isActive ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Block user"
                                  disabled={blocking === user.id}
                                  onClick={() => blockUser(user.id)}
                                >
                                  {blocking === user.id ? "..." : "Block"}
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                                  title="Unblock user"
                                  disabled={blocking === user.id}
                                  onClick={() => unblockUser(user.id)}
                                >
                                  {blocking === user.id ? "..." : "Unblock"}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 3: BLOCKED USERS */}
            {blockedUsers.length > 0 && (
              <div className="space-y-4 mt-8 pt-8 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-red-500 rounded"></div>
                  <h3 className="text-lg font-semibold">Blocked Users</h3>
                  <span className="ml-auto bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                    {blockedUsers.length}
                  </span>
                </div>

                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Email</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Name</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Role</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Status</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Joined</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blockedUsers.map((user) => (
                        <tr key={user.id} className="border-t hover:bg-muted/50">
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-muted-foreground truncate text-xs">{user.email}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium truncate">{user.fullName}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                              SUSPENDED
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-muted-foreground text-xs">{formatDate(user.createdAt)}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <Button
                              size="sm"
                              className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
                              disabled={blocking === user.id}
                              onClick={() => unblockUser(user.id)}
                            >
                              {blocking === user.id ? "..." : "Unblock"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
