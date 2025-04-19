
export interface AuthUser {
  id: string;
  email?: string;
  username?: string;
  avatarUrl?: string;
}

export interface AuthSession {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
