export class UserEntity {
  id?: string | null;
  email: string;
  password?: string;
  firstName?: string | null;
  lastName?: string | null;
  image?: string | null;
  address?: string | null;
  gender?: string | null;
  dob?: Date | null;
  phone?: string | null;
  role?: string | null;
  isActive?: boolean | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }

  // Method to get user without password
  toJSON() {
    const { password, ...user } = this;
    return user;
  }
}
