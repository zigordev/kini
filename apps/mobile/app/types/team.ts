export type TeamRole = 'admin' | 'member';

export type Team = {
  id: string;
  name: string;
  ownerId: string;
  role: TeamRole;
  createdAt: string;
  updatedAt: string;
};
