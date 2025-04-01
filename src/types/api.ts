import { SQL } from "drizzle-orm";

export interface RawBuildQueryResult {
  id: number;
  name: string;
  slug: string;
  components: string;
  totalPrice: string;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  user_id: number | null;
  user_email: string | null;
  firstName: string | null;
  lastName: string | null;
}

export interface BuildQueryResult {
  id: number;
  name: string;
  slug: string;
  components: string;
  totalPrice: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  user: {
    id: number;
    email: string;
    profile: {
      firstName: string | null;
      lastName: string | null;
    };
  };
}
