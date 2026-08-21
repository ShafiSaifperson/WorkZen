import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getDb } from './db';

/*export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
}
  */
export type UserRole = 'candidate' | 'company' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}
export type OAuthProvider = 'google';

export interface OAuthProfile {
  provider: OAuthProvider;
  providerUserId: string;
  email: string;
  fullName: string;
}

export interface OAuthSignInOptions {
  role?: UserRole;
  fullName?: string;
}

export async function signInWithOAuthProfile(
  profile: OAuthProfile,
  options?: OAuthSignInOptions
): Promise<AuthUser> {
  const db = await getDb();
  const email = profile.email.toLowerCase().trim();
  const requestedRole = options?.role ?? 'candidate';

  const identity = await db.query(
    `SELECT u.id, u.email, u.full_name, u.role
     FROM user_identities i
     JOIN users u ON u.id = i.user_id
     WHERE i.provider = $1 AND i.provider_user_id = $2`,
    [profile.provider, profile.providerUserId]
  );

  let user: AuthUser;

  if (identity.rows.length > 0) {
    const row = identity.rows[0] as { id: string; email: string; full_name: string; role?: string };
    let effectiveRole: UserRole = (row.role === 'company' || row.role === 'admin')
      ? (row.role as UserRole)
      : 'candidate';

    // If explicitly signing up as company/admin, upgrade role if needed
    if ((options?.role === 'company' || options?.role === 'admin') && effectiveRole === 'candidate') {
      effectiveRole = options.role;
      await db.query('UPDATE users SET role = $1 WHERE id = $2', [effectiveRole, row.id]);
    }

    user = {
      id: row.id,
      email: row.email,
      full_name: row.full_name || profile.fullName || email.split('@')[0],
      role: effectiveRole,
    };
  } else {
    const existing = await db.query(
      'SELECT id, email, full_name, role FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0] as { id: string; email: string; full_name: string; role?: string };
      let effectiveRole: UserRole = (row.role === 'company' || row.role === 'admin')
        ? (row.role as UserRole)
        : (options?.role ?? 'candidate');

      if ((options?.role === 'company' || options?.role === 'admin') && row.role !== effectiveRole) {
        effectiveRole = options.role;
        await db.query('UPDATE users SET role = $1 WHERE id = $2', [effectiveRole, row.id]);
      }

      user = {
        id: row.id,
        email: row.email,
        full_name: row.full_name || profile.fullName || email.split('@')[0],
        role: effectiveRole,
      };
    } else {
      const fullName = options?.fullName?.trim() || profile.fullName?.trim() || email.split('@')[0];
      user = {
        id: `u${crypto.randomUUID()}`,
        email,
        full_name: fullName,
        role: requestedRole,
      };

      await db.query(
        'INSERT INTO users (id, email, password, full_name, role) VALUES ($1, $2, $3, $4, $5)',
        [user.id, user.email, crypto.randomUUID(), user.full_name, user.role]
      );
    }

    await db.query(
      `INSERT INTO user_identities (id, user_id, provider, provider_user_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (provider, provider_user_id) DO UPDATE SET user_id = EXCLUDED.user_id`,
      [crypto.randomUUID(), user.id, profile.provider, profile.providerUserId]
    );
  }

  localStorage.setItem('workzen-user', JSON.stringify(user));
  return user;
}

export async function signInWithPassword(email: string, password: string): Promise<AuthUser> {
  const db = await getDb();
  const result = await db.query(
    'SELECT id, email, full_name, role FROM users WHERE email = $1 AND password = $2',
    [email.toLowerCase().trim(), password]
  );
  if (result.rows.length === 0) {
    throw new Error('Invalid login credentials');
  }
  const user = result.rows[0] as AuthUser;
  localStorage.setItem('workzen-user', JSON.stringify(user));
  return user;
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: UserRole = 'candidate'
): Promise<AuthUser> {
  const db = await getDb();
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
  if (existing.rows.length > 0) {
    throw new Error('An account with this email already exists.');
  }
  const id = 'u' + Date.now();
  await db.query(
    'INSERT INTO users (id, email, password, full_name, role) VALUES ($1, $2, $3, $4, $5)',
    [id, email.toLowerCase().trim(), password, fullName, role]
  );
  const user: AuthUser = {
    id,
    email: email.toLowerCase().trim(),
    full_name: fullName,
    role,
  };
  localStorage.setItem('workzen-user', JSON.stringify(user));
  return user;
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem('workzen-user');
  if (!raw) return null;

  try {
    const user = JSON.parse(raw) as Partial<AuthUser>;
    if (!user.id || !user.email) return null;

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name ?? '',
      role: user.role === 'company' || user.role === 'admin' ? user.role : 'candidate',
    };
  } catch {
    return null;
  }
}

export function signOut(): void {
  localStorage.removeItem('workzen-user');
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signInWithOAuthProfile: (profile: OAuthProfile, options?: OAuthSignInOptions) => Promise<AuthUser>;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (email: string, password: string, fullName: string, role?: UserRole) => Promise<AuthUser>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signIn: async () => { throw new Error('AuthProvider not mounted'); },
  signUp: async () => { throw new Error('AuthProvider not mounted'); },
  signInWithOAuthProfile: async () => {
    throw new Error('AuthProvider not mounted');
  },
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getDb()
      .then(() => {
        if (cancelled) return;
        const stored = getStoredUser();
        if (stored) setUser(stored);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[WorkZen] Failed to initialize database:', err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSignIn(email: string, password: string) {
    const u = await signInWithPassword(email, password);
    setUser(u);
    return u;
  }

  async function handleSignUp(email: string, password: string, fullName: string, role: UserRole = 'candidate') {
    const u = await signUp(email, password, fullName, role);
    setUser(u);
    return u;
  }

  function handleSignOut() {
    signOut();
    setUser(null);
  }

  async function handleOAuthProfile(profile: OAuthProfile, options?: OAuthSignInOptions) {
    const u = await signInWithOAuthProfile(profile, options);
    setUser(u);
    return u;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signInWithOAuthProfile: handleOAuthProfile,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
