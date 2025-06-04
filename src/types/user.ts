export interface UserProfile {
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  city: string | null;
}

export interface User {
  id: number;
  email: string;
  roleId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
  lastLoginAt?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  city?: string | null;
  profile?: UserProfile;
}
