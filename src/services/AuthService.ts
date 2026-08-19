import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { StaffRepository } from '../repositories/StaffRepository';
import { IStaff } from '../interfaces/types';

export class AuthService {
  private staffRepository: StaffRepository;

  constructor(staffRepository: StaffRepository) {
    this.staffRepository = staffRepository;
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ token: string; staff: Omit<IStaff, 'password_hash'> }> {
    const staff = await this.staffRepository.findByEmail(email);
    if (!staff) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, staff.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
    const token = jwt.sign(
      {
        id: staff.id,
        email: staff.email,
        name: staff.name,
      },
      jwtSecret,
      { expiresIn: '24h' },
    );

    const staffWithoutPassword: any = { ...staff };
    delete staffWithoutPassword.password_hash;

    return {
      token,
      staff: staffWithoutPassword,
    };
  }
}
