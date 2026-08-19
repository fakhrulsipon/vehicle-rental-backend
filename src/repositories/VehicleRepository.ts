import { Knex } from 'knex';
import { BaseRepository } from './BaseRepository';
import { IVehicle, IVehicleFilters } from '../interfaces/types';

export class VehicleRepository extends BaseRepository<IVehicle> {
  constructor(knex: Knex) {
    super(knex, 'vehicles');
  }

  async findByPlateNumber(plateNumber: string): Promise<IVehicle | undefined> {
    const row = await this.knex(this.tableName)
      .where({ plate_number: plateNumber })
      .whereNull('deleted_at')
      .first();
    return row as unknown as IVehicle | undefined;
  }

  async findActiveById(id: number): Promise<IVehicle | undefined> {
    const row = await this.knex(this.tableName)
      .where({ id })
      .whereNull('deleted_at')
      .first();
    return row as unknown as IVehicle | undefined;
  }

  async findAllActive(filters: IVehicleFilters): Promise<{ data: IVehicle[]; total: number; page: number; limit: number }> {
    const page = filters.page && filters.page > 0 ? Number(filters.page) : 1;
    const limit = filters.limit && filters.limit > 0 ? Number(filters.limit) : 10;
    const offset = (page - 1) * limit;

    const query = this.knex(this.tableName).whereNull('deleted_at');

    if (filters.category) {
      query.where('category', 'ILIKE', `%${filters.category}%`);
    }

    if (filters.search) {
      query.where('name', 'ILIKE', `%${filters.search}%`);
    }

    const [{ count }] = await query.clone().count('id as count');
    const total = Number(count);

    const rows = await query.select('*').orderBy('id', 'desc').limit(limit).offset(offset);

    return {
      data: rows as unknown as IVehicle[],
      total,
      page,
      limit,
    };
  }

  async softDelete(id: number): Promise<boolean> {
    const rowsAffected = await this.knex(this.tableName)
      .where({ id })
      .whereNull('deleted_at')
      .update({
        deleted_at: new Date(),
        updated_at: new Date(),
      });

    return rowsAffected > 0;
  }
}