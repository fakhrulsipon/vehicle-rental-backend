import { Knex } from 'knex';
import { BaseRepository } from './BaseRepository';
import { IRental, IRentalFilters } from '../interfaces/types';

export class RentalRepository extends BaseRepository<IRental> {
  constructor(knex: Knex) {
    super(knex, 'rentals');
  }

  /**
   * Overlap Check Engine:
   * Two date ranges (A, B) overlap if: (StartA <= EndB) AND (EndA >= StartB)
   * Only active status ('booked', 'ongoing') conflicts.
   */
  async checkOverlap(
    vehicleId: number,
    startDate: string,
    endDate: string,
    excludeRentalId?: number,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const query = (trx ? trx(this.tableName) : this.knex(this.tableName))
      .where({ vehicle_id: vehicleId })
      .whereIn('status', ['booked', 'ongoing'])
      .where('start_date', '<=', endDate)
      .where('end_date', '>=', startDate);

    if (excludeRentalId) {
      query.whereNot({ id: excludeRentalId });
    }

    const existingRental = await query.first();
    return !!existingRental;
  }

  async findAllWithFilters(filters: IRentalFilters): Promise<{ data: IRental[]; total: number; page: number; limit: number }> {
    const page = filters.page && filters.page > 0 ? Number(filters.page) : 1;
    const limit = filters.limit && filters.limit > 0 ? Number(filters.limit) : 10;
    const offset = (page - 1) * limit;

    const query = this.knex(this.tableName);

    if (filters.vehicle_id) {
      query.where('vehicle_id', filters.vehicle_id);
    }

    if (filters.status) {
      query.where('status', filters.status);
    }

    if (filters.start_date) {
      query.where('start_date', '>=', filters.start_date);
    }

    if (filters.end_date) {
      query.where('end_date', '<=', filters.end_date);
    }

    const [{ count }] = await query.clone().count('id as count');
    const total = Number(count);

    const rows = await query.select('*').orderBy('id', 'desc').limit(limit).offset(offset);

    return {
      data: rows as unknown as IRental[],
      total,
      page,
      limit,
    };
  }
}