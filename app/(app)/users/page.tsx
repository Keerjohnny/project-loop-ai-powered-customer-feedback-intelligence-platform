"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type UserRole = "ADMIN" | "ANALYST" | "VIEWER";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

const roleColors: Record<UserRole, string> = {
  ADMIN: "bg-red-100 text-red-700 ring-red-200",
  ANALYST: "bg-blue-100 text-blue-700 ring-blue-200",
  VIEWER: "bg-gray-100 text-gray-700 ring-gray-200",
};

const assignableRoleOptions: Array<Exclude<UserRole, "ADMIN">> = ["ANALYST", "VIEWER"];

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);

  const loadUsers = useCallback(async () => {
    const storedUser = localStorage.getItem("user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    const userId = parsedUser?.id || null;
    const userRole = parsedUser?.role || null;

    setCurrentUserId(userId);
    setCurrentUserRole(userRole);

    if (!userId) {
      router.replace("/signin");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/users", {
        method: "GET",
        headers: {
          "x-user-id": userId,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Unable to load users");
      }

      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load users");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  useEffect(() => {
    if (!toastMessage) return;

    const timer = window.setTimeout(() => setToastMessage(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const isAdmin = currentUserRole === "ADMIN";

  const handleRoleChange = async (userId: string, nextRole: UserRole) => {
    if (!currentUserId || !isAdmin) return;

    const targetUser = users.find((item) => item.id === userId);
    if (!targetUser) return;

    if (targetUser.role === "ADMIN" && nextRole !== "ADMIN") {
      const confirmed = window.confirm(
        `Are you sure you want to change ${targetUser.name}'s role to ${nextRole}?`
      );

      if (!confirmed) return;
    }

    setUpdatingId(userId);
    setError(null);

    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUserId,
        },
        body: JSON.stringify({ role: nextRole, confirm: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Unable to update role");
      }

      setToastMessage("Role updated successfully.");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update role");
    } finally {
      setUpdatingId(null);
    }
  };

  const tableRows = useMemo(() => users, [users]);

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              Workspace access
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">User Management</h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage team roles and maintain secure access across your workspace.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
            {isAdmin ? "Admin controls enabled" : "View-only access"}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Users</h2>
              <p className="text-sm text-slate-500">Manage roles and review workspace members.</p>
            </div>
          </div>

          {toastMessage ? (
            <div className="border-b border-emerald-200 bg-emerald-50 px-6 py-4 text-sm text-emerald-700">
              {toastMessage}
            </div>
          ) : null}

          {error ? (
            <div className="border-b border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading users...
            </div>
          ) : tableRows.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-500">
              No users found for this workspace.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Avatar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Current Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Role Dropdown
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {tableRows.map((user) => {
                    const isCurrentUser = user.id === currentUserId;
                    const isUpdating = updatingId === user.id;

                    return (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                            {user.name
                              .split(" ")
                              .map((value) => value[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{user.name}</div>
                          {isCurrentUser ? (
                            <div className="text-xs text-slate-500">You</div>
                          ) : null}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${roleColors[user.role]}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={user.role}
                            disabled={!isAdmin || isUpdating || isCurrentUser}
                            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {user.role === "ADMIN" ? (
                              <option value="ADMIN">ADMIN</option>
                            ) : null}
                            {assignableRoleOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {isUpdating ? (
                            <span className="inline-flex items-center text-sm text-slate-500">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </span>
                          ) : (
                            <Button variant="outline" size="sm" disabled={!isAdmin || isCurrentUser}>
                              {isCurrentUser ? "Self" : isAdmin ? "Manage" : "View only"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
