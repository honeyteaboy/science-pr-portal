export type AdminRole = "superadmin" | "editor" | "reviewer" | "viewer";

export type AdminAccount = {
  id: number;
  username: string;
  name: string;
  role: AdminRole;
  password: string;
};

export type AdminSession = Pick<AdminAccount, "id" | "username" | "name" | "role">;

const STORAGE_KEY = "science-admin-users";
export const SESSION_KEY = "science-admin-session";

export const DEFAULT_ADMIN_ACCOUNTS: AdminAccount[] = [
  { id: 1001, username: "admin", name: "ผู้ดูแลระบบสูงสุด", role: "superadmin", password: "admin123" },
  { id: 1002, username: "secretary", name: "เลขาหลักสูตร", role: "editor", password: "secretary123" },
  { id: 1003, username: "reviewer", name: "ผู้ตรวจสอบ", role: "reviewer", password: "reviewer123" },
];

/**
 * Prototype-only account store. This is browser localStorage, not secure authentication.
 * The real deployment should replace this module with server-side auth and a database.
 */
export function loadAdminAccounts(): AdminAccount[] {
  let stored: AdminAccount[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        stored = parsed
          .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
          .map((item, index) => ({
            id: typeof item.id === "number" ? item.id : Date.now() + index,
            username: typeof item.username === "string" ? item.username : "",
            name: typeof item.name === "string" ? item.name : "",
            role: ["superadmin", "editor", "reviewer", "viewer"].includes(String(item.role))
              ? (item.role as AdminRole)
              : "viewer",
            password: typeof item.password === "string" ? item.password : "",
          }))
          .filter((item) => item.username.length > 0);
      }
    }
  } catch {
    stored = [];
  }

  const accounts = [...stored];
  for (const defaultAccount of DEFAULT_ADMIN_ACCOUNTS) {
    const existingIndex = accounts.findIndex((account) => account.username === defaultAccount.username);
    if (existingIndex === -1) {
      accounts.push(defaultAccount);
    } else if (!accounts[existingIndex].password) {
      accounts[existingIndex] = { ...accounts[existingIndex], ...defaultAccount };
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // Ignore storage errors in the prototype; the login screen will show a normal failure.
  }
  return accounts;
}

export function authenticateAdmin(username: string, password: string): AdminSession | null {
  const account = loadAdminAccounts().find(
    (item) => item.username.toLowerCase() === username.trim().toLowerCase() && item.password === password,
  );
  if (!account) return null;

  const session: AdminSession = {
    id: account.id,
    username: account.username,
    name: account.name,
    role: account.role,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearAdminSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function adminRoleLabel(role: AdminRole): string {
  switch (role) {
    case "superadmin": return "ผู้ดูแลระบบสูงสุด";
    case "editor": return "เลขาหลักสูตร / ผู้โพสต์";
    case "reviewer": return "ผู้ตรวจสอบ / ผู้อนุมัติ";
    case "viewer": return "ผู้เข้าชมอย่างเดียว";
  }
}
