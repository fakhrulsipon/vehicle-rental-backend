import type { Knex } from 'knex';
import bcrypt from 'bcrypt';

export async function seed(knex: Knex): Promise<void> {
  // Purge existing data
  await knex('rentals').del();
  await knex('vehicles').del();
  await knex('staff').del();

  const hashedPassword = await bcrypt.hash('admin123', 10);

  // 1. Seed Staff
  await knex('staff').insert([
    {
      email: 'admin@vehiclerental.com',
      password_hash: hashedPassword,
      name: 'System Admin Staff',
    },
  ]);

  // 2. Seed Vehicles
  const [car1, car2] = await knex('vehicles')
    .insert([
      {
        name: 'Toyota Corolla',
        plate_number: 'DHAKA-METRO-GA-11-2233',
        category: 'Sedan',
        daily_rate: 50.0,
      },
      {
        name: 'Honda CR-V',
        plate_number: 'DHAKA-METRO-GH-44-5566',
        category: 'SUV',
        daily_rate: 80.0,
      },
    ])
    .returning('*');

  // 3. Seed Rentals
  // Special Requirement: Seed at least one rental that spans a month boundary (July 29 – Aug 3)
  await knex('rentals').insert([
    {
      vehicle_id: car1.id,
      customer_name: 'Rahim Ahmed',
      customer_phone: '01711112233',
      start_date: '2026-07-29',
      end_date: '2026-08-03',
      total_amount: 300.0, // 6 days * $50
      status: 'ongoing',
    },
    {
      vehicle_id: car2.id,
      customer_name: 'Karim Chowdhury',
      customer_phone: '01899998877',
      start_date: '2026-08-10',
      end_date: '2026-08-15',
      total_amount: 480.0, // 6 days * $80
      status: 'booked',
    },
  ]);
}
