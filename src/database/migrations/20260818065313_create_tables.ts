import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Staff Table
  await knex.schema.createTable('staff', (table) => {
    table.increments('id').primary();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('name', 255).notNullable();
    table.timestamps(true, true);
  });

  // 2. Vehicles Table
  await knex.schema.createTable('vehicles', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('plate_number', 100).notNullable().unique();
    table.string('category', 100).notNullable();
    table.decimal('daily_rate', 10, 2).notNullable();
    table.string('photo_path', 255).nullable();
    table.timestamp('deleted_at').nullable(); // Soft delete support
    table.timestamps(true, true);
  });

  // 3. Rentals Table
  await knex.schema.createTable('rentals', (table) => {
    table.increments('id').primary();
    table
      .integer('vehicle_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('vehicles')
      .onDelete('CASCADE');
    table.string('customer_name', 255).notNullable();
    table.string('customer_phone', 50).notNullable();
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.decimal('total_amount', 10, 2).notNullable();
    table
      .enum('status', ['booked', 'ongoing', 'completed', 'cancelled'])
      .defaultTo('booked')
      .notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('rentals');
  await knex.schema.dropTableIfExists('vehicles');
  await knex.schema.dropTableIfExists('staff');
}
