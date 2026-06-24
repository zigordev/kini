export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  givenName: string | null;
  familyName: string | null;
}
