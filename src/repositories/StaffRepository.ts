import { Knex } from 'knex';
import { BaseRepository } from './BaseRepository';
import { IStaff } from '../interfaces/types';

export class StaffRepository extends BaseRepository<IStaff> {
  constructor(knex: Knex) {
    super(knex, 'staff');
  }

  async findByEmail(email: string): Promise<IStaff | undefined> {
    const row = await this.knex(this.tableName).where({ email }).first();
    return row as unknown as IStaff | undefined;
  }
}