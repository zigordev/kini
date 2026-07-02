export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  givenName: string | null;
  familyName: string | null;
  language?: 'en' | 'es' | null;
  theme?: 'light' | 'dark' | null;
  activeTeamId?: string | null;
}
