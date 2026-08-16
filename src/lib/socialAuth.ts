import type { OAuthProfile } from './auth';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (options: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
    FB?: {
      init: (options: Record<string, unknown>) => void;
      login: (
        callback: (response: { authResponse?: unknown }) => void,
        options: { scope: string }
      ) => void;
      api: (
        path: string,
        params: Record<string, string>,
        callback: (response: { id?: string; email?: string; name?: string }) => void
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load sign-in provider.'));
    document.head.appendChild(script);
  });
}

export async function signInWithGoogle(): Promise<OAuthProfile> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('Google sign-in is not configured.');

  await loadScript('https://accounts.google.com/gsi/client');

  const accessToken = await new Promise<string>((resolve, reject) => {
    const client = window.google?.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error('Google sign-in was cancelled.'));
          return;
        }
        resolve(response.access_token);
      },
    });

    if (!client) {
      reject(new Error('Google sign-in is unavailable.'));
      return;
    }

    client.requestAccessToken();
  });

  const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error('Could not load your Google profile.');

  const user = await response.json() as {
    sub: string;
    email: string;
    name?: string;
  };

  return {
    provider: 'google',
    providerUserId: user.sub,
    email: user.email,
    fullName: user.name ?? '',
  };
}

export async function signInWithFacebook(): Promise<OAuthProfile> {
  const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
  if (!appId) throw new Error('Facebook sign-in is not configured.');

  await loadScript('https://connect.facebook.net/en_US/sdk.js');

  await new Promise<void>((resolve) => {
    window.FB?.init({
      appId,
      cookie: false,
      xfbml: false,
      version: 'v23.0',
    });
    resolve();
  });

  const login = await new Promise<{ authResponse?: unknown }>((resolve) => {
    window.FB?.login(resolve, { scope: 'public_profile,email' });
  });

  if (!login.authResponse) throw new Error('Facebook sign-in was cancelled.');

  const user = await new Promise<{ id?: string; email?: string; name?: string }>((resolve) => {
    window.FB?.api('/me', { fields: 'id,name,email' }, resolve);
  });

  if (!user.id || !user.email) {
    throw new Error('Your Facebook account must provide an email address.');
  }

  return {
    provider: 'facebook',
    providerUserId: user.id,
    email: user.email,
    fullName: user.name ?? '',
  };
}