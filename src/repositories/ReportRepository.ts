import { Knex } from 'knex';

export interface IMonthlyReportParams {
  year: number;
  month: number;
}

export interface IMonthlyReportResult {
  total_rentals: number;
  total_days_booked: number;
  total_revenue: number;
  highest_revenue_vehicle: {
    vehicle_id: number | null;
    registration_number: string | null;
    model: string | null;
    revenue: number;
  } | null;
}

export class ReportRepository {
  private knex: Knex;

  constructor(knex: Knex) {
    this.knex = knex;
  }

  async getMonthlyReport({ year, month }: IMonthlyReportParams): Promise<IMonthlyReportResult> {
    // Calculate month boundary dates (YYYY-MM-DD)
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    
    // Last day of the requested month
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    /**
     * PostgreSQL/MySQL SQL Engine:
     * Overlapped start date = GREATEST(rental.start_date, month_start)
     * Overlapped end date   = LEAST(rental.end_date, month_end)
     * Days in month         = (Overlapped end date - Overlapped start date) + 1
     * Revenue in month      = Days in month * vehicle.daily_rate
     */
    const rawQuery = `
      SELECT 
        r.id as rental_id,
        r.vehicle_id,
        v.registration_number,
        v.model,
        v.daily_rate,
        (
          GREATEST(r.start_date, ?::date)
        ) as clamped_start,
        (
          LEAST(r.end_date, ?::date)
        ) as clamped_end,
        (
          LEAST(r.end_date, ?::date) - GREATEST(r.start_date, ?::date) + 1
        ) as days_in_month,
        (
          (LEAST(r.end_date, ?::date) - GREATEST(r.start_date, ?::date) + 1) * v.daily_rate
        ) as monthly_revenue
      FROM rentals r
      JOIN vehicles v ON r.vehicle_id = v.id
      WHERE r.status IN ('booked', 'ongoing', 'completed')
        AND r.start_date <= ?::date
        AND r.end_date >= ?::date
    `;

    const rentalsInMonth = await this.knex.raw(rawQuery, [
      startDate,
      endDate,
      endDate,
      startDate,
      endDate,
      startDate,
      endDate,
      startDate,
    ]);

    const rows = rentalsInMonth.rows || rentalsInMonth[0] || [];

    if (rows.length === 0) {
      return {
        total_rentals: 0,
        total_days_booked: 0,
        total_revenue: 0,
        highest_revenue_vehicle: null,
      };
    }

    let totalRevenue = 0;
    let totalDaysBooked = 0;
    const vehicleRevenueMap: Record<number, { registration_number: string; model: string; revenue: number }> = {};

    for (const row of rows) {
      const days = Number(row.days_in_month);
      const revenue = Number(row.monthly_revenue);

      totalDaysBooked += days;
      totalRevenue += revenue;

      if (!vehicleRevenueMap[row.vehicle_id]) {
        vehicleRevenueMap[row.vehicle_id] = {
          registration_number: row.registration_number,
          model: row.model,
          revenue: 0,
        };
      }

      vehicleRevenueMap[row.vehicle_id].revenue += revenue;
    }

    // Find highest revenue vehicle
    let highestVehicle = null;
    let maxRevenue = -1;

    for (const [vehicleId, data] of Object.entries(vehicleRevenueMap)) {
      if (data.revenue > maxRevenue) {
        maxRevenue = data.revenue;
        highestVehicle = {
          vehicle_id: Number(vehicleId),
          registration_number: data.registration_number,
          model: data.model,
          revenue: Number(data.revenue.toFixed(2)),
        };
      }
    }

    return {
      total_rentals: rows.length,
      total_days_booked: totalDaysBooked,
      total_revenue: Number(totalRevenue.toFixed(2)),
      highest_revenue_vehicle: highestVehicle,
    };
  }
}