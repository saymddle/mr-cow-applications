/** The signed-in identity as the identity provider reports it. TOGIVA authorizes separately. */
export interface AuthSession {
  accessToken: string;
  userId: string;
  email: string | null;
  emailVerified: boolean;
}

export type AuthResult = { ok: true; needsEmailConfirmation?: boolean } | { ok: false; message: string };

/**
 * Identity provider boundary. The apps only talk to this interface, so the
 * provider (Supabase Auth today) can change without touching screens.
 */
export interface AuthAdapter {
  readonly kind: "supabase" | "dev-token";
  getSession(): Promise<AuthSession | null>;
  /** Returns a fresh access token (refreshing if needed), or null when signed out. */
  getAccessToken(): Promise<string | null>;
  onChange(listener: (session: AuthSession | null) => void): () => void;
  signInWithPassword(email: string, password: string): Promise<AuthResult>;
  signUp(email: string, password: string, options?: { emailRedirectTo?: string }): Promise<AuthResult>;
  sendPasswordReset(email: string, options?: { redirectTo?: string }): Promise<AuthResult>;
  signOut(): Promise<void>;
}
