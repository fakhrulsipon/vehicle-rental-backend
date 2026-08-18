import { Knex } from 'knex';

export abstract class BaseRepository<T extends { id?: number }> {
  protected knex: Knex;
  protected tableName: string;

  constructor(knex: Knex, tableName: string) {
    this.knex = knex;
    this.tableName = tableName;
  }

  async findAll(): Promise<T[]> {
    const rows = await this.knex(this.tableName).select('*');
    return rows as unknown as T[];
  }

  async findById(id: number): Promise<T | undefined> {
    const row = await this.knex(this.tableName).where({ id }).first();
    return row as unknown as T | undefined;
  }

  async create(item: Omit<T, 'id'>, trx?: Knex.Transaction): Promise<T> {
    const query = this.knex(this.tableName).insert(item as any).returning('*');
    if (trx) {
      query.transacting(trx);
    }
    const [newItem] = await query;
    return newItem as unknown as T;
  }

  async update(id: number, item: Partial<T>, trx?: Knex.Transaction): Promise<T | undefined> {
    const query = this.knex(this.tableName)
      .where({ id })
      .update(item as any)
      .returning('*');
    if (trx) {
      query.transacting(trx);
    }
    const [updatedItem] = await query;
    return updatedItem as unknown as T;
  }

  async delete(id: number): Promise<boolean> {
    const rowsAffected = await this.knex(this.tableName).where({ id }).del();
    return rowsAffected > 0;
  }
}