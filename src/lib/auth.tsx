import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getDb } from './db';

/*export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
}
  */
 export type UserRole = 'candidate' | 'company';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}
export type OAuthProvider = 'google' | 'facebook';

export interface OAuthProfile {
  provider: OAuthProvider;
  providerUserId: string;
  email: string;
  fullName: string;
}

export async function signInWithOAuthProfile(profile: OAuthProfile): Promise<AuthUser> {
  const db = await getDb();
  const email = profile.email.toLowerCase().trim();

  const identity = await db.query(
    `SELECT u.id, u.email, u.full_name
     FROM user_identities i
     JOIN users u ON u.id = i.user_id
     WHERE i.provider = $1 AND i.provider_user_id = $2`,
    [profile.provider, profile.providerUserId]
  );

  let user: AuthUser;

  if (identity.rows.length) {
    user = identity.rows[0] as AuthUser;
  } else {
    const existing = await db.query(
      'SELECT id, email, full_name, role FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length) {
      user = existing.rows[0] as AuthUser;
    } else {
      user = {
  id: `u${crypto.randomUUID()}`,
  email,
  full_name: profile.fullName || email.split('@')[0],
  role: 'candidate',
};

      await db.query(
        'INSERT INTO users (id, email, password, full_name) VALUES ($1, $2, $3, $4)',
        [user.id, user.email, crypto.randomUUID(), user.full_name]
      );
    }

    await db.query(
      'INSERT INTO user_identities (id, user_id, provider, provider_user_id) VALUES ($1, $2, $3, $4)',
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

export async function signUp(email: string, password: string, fullName: string): Promise<AuthUser> {
  const db = await getDb();
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
  if (existing.rows.length > 0) {
    throw new Error('An account with this email already exists.');
  }
  const id = 'u' + Date.now();
  await db.query(
    'INSERT INTO users (id, email, password, full_name, role) VALUES ($1, $2, $3, $4, $5)',
[id, email.toLowerCase().trim(), password, fullName, 'candidate']
  );
  const user: AuthUser = {
  id,
  email: email.toLowerCase().trim(),
  full_name: fullName,
  role: 'candidate',
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
      role: user.role === 'company' ? 'company' : 'candidate',
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
  signInWithOAuthProfile: (profile: OAuthProfile) => Promise<AuthUser>;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (email: string, password: string, fullName: string) => Promise<AuthUser>;
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
  signUp: handleSignUp,
  signInWithOAuthProfile: handleOAuthProfile,
  signOut: handleSignOut,
}}
    >
      {children}
    </AuthContext.Provider>
  );
  async function handleOAuthProfile(profile: OAuthProfile) {
  const u = await signInWithOAuthProfile(profile);
  setUser(u);
  return u;
}
}

export function useAuth() {
  return useContext(AuthContext);
  

  
}
