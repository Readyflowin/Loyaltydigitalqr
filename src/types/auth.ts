export interface MockUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  isMock: true;
  createdAt: string;
}

export type AuthMode = 'demo-google' | 'demo-email';
