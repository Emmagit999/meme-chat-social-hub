
export interface AuthUser {
  id: string;
  email?: string;
  username?: string;
  avatarUrl?: string;
  // Added properties to match usage in components
  avatar?: string;
  displayName?: string;
  bio?: string;
  isPro?: boolean;
}

export interface AuthSession {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
