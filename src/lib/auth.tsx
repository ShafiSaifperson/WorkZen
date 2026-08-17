import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getDb } from './db';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
}

export async function signInWithPassword(email: string, password: string): Promise<AuthUser> {
  const db = await getDb();
  const result = await db.query(
    'SELECT id, email, full_name FROM users WHERE email = $1 AND password = $2',
    [email.toLowerCase().trim(), password]
  );
  if (result.rows.length === 0) {
    throw new Error('Invalid login credentials');
  }
  const user = result.rows[0] as AuthUser;
  localStorage.setItem('workzen-user', JSON.stringify(user));
  return user;
}

export async function signUp(email: string, password: string, fullName: string): Promise<AuthUser> {
  const db = await getDb();
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
  if (existing.rows.length > 0) {
    throw new Error('An account with this email already exists.');
  }
  const id = 'u' + Date.now();
  await db.query(
    'INSERT INTO users (id, email, password, full_name) VALUES ($1, $2, $3, $4)',
    [id, email.toLowerCase().trim(), password, fullName]
  );
  const user: AuthUser = { id, email: email.toLowerCase().trim(), full_name: fullName };
  localStorage.setItem('workzen-user', JSON.stringify(user));
  return user;
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem('workzen-user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function signOut(): void {
  localStorage.removeItem('workzen-user');
}

export interface OAuthProfile {
  provider: string;
  providerUserId: string;
  email: string;
  fullName: string;
}

export async function signInWithOAuth(profile: OAuthProfile): Promise<AuthUser> {
  const db = await getDb();
  const existing = await db.query('SELECT id, email, full_name FROM users WHERE email = $1', [profile.email.toLowerCase().trim()]);
  if (existing.rows.length > 0) {
    const user = existing.rows[0] as AuthUser;
    localStorage.setItem('workzen-user', JSON.stringify(user));
    return user;
  }
  const id = 'u' + Date.now();
  await db.query(
    'INSERT INTO users (id, email, password, full_name) VALUES ($1, $2, $3, $4)',
    [id, profile.email.toLowerCase().trim(), 'oauth_account', profile.fullName || profile.email.split('@')[0]]
  );
  const user: AuthUser = { id, email: profile.email.toLowerCase().trim(), full_name: profile.fullName || profile.email.split('@')[0] };
  localStorage.setItem('workzen-user', JSON.stringify(user));
  return user;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signInWithOAuthProfile: (profile: OAuthProfile) => Promise<AuthUser>;
  signUp: (email: string, password: string, fullName: string) => Promise<AuthUser>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signIn: async () => { throw new Error('AuthProvider not mounted'); },
  signInWithOAuthProfile: async () => { throw new Error('AuthProvider not mounted'); },
  signUp: async () => { throw new Error('AuthProvider not mounted'); },
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

  async function handleSignInWithOAuthProfile(profile: OAuthProfile) {
    const u = await signInWithOAuth(profile);
    setUser(u);
    return u;
  }

  async function handleSignUp(email: string, password: string, fullName: string) {
    const u = await signUp(email, password, fullName);
    setUser(u);
    return u;
  }

  function handleSignOut() {
    signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn: handleSignIn,
        signInWithOAuthProfile: handleSignInWithOAuthProfile,
        signUp: handleSignUp,
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
