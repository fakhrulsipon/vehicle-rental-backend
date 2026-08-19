import { Knex } from 'knex';
import bcrypt from 'bcrypt';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing entries
  await knex('rentals').del();
  await knex('vehicles').del();
  await knex('users').del();

  // 1. Seed Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const [admin] = await knex('users')
    .insert({
      name: 'System Admin',
      email: 'admin@rental.com',
      password: hashedPassword,
      role: 'admin',
    })
    .returning('*');

  // 2. Seed Vehicles
  const vehicles = await knex('vehicles')
    .insert([
      {
        registration_number: 'DHAKA-METRO-GA-11-2233',
        model: 'Toyota Premio 2020',
        type: 'car',
        daily_rate: 3500.00,
        is_active: true,
      },
      {
        registration_number: 'DHAKA-METRO-HA-44-5566',
        model: 'Honda Vezel 2021',
        type: 'car',
        daily_rate: 4500.00,
        is_active: true,
      },
      {
        registration_number: 'DHAKA-METRO-LA-77-8899',
        model: 'Yamaha R15 V4',
        type: 'bike',
        daily_rate: 1200.00,
        is_active: true,
      },
    ])
    .returning('*');

  // 3. Seed Sample Rentals
  await knex('rentals').insert([
    {
      vehicle_id: vehicles[0].id,
      customer_name: 'Rafiqul Islam',
      customer_phone: '01711000000',
      start_date: '2026-02-01',
      end_date: '2026-02-05',
      total_amount: 17500.00,
      status: 'completed',
    },
    {
      vehicle_id: vehicles[1].id,
      customer_name: 'Tanvir Hossain',
      customer_phone: '01811000000',
      start_date: '2026-02-10',
      end_date: '2026-02-15',
      total_amount: 27000.00,
      status: 'booked',
    },
  ]);

  console.log('Seeding completed successfully!');
}