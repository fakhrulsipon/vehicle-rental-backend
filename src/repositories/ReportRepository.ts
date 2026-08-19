import { Knex } from 'knex';

export interface IMonthlyReportParams {
  month: string; // YYYY-MM
  vehicle_id?: number;
}

export interface IVehicleReportItem {
  id: number;
  name: string;
  plate_number: string;
  total_bookings: number;
  days_rented: number;
  revenue: number;
}

export interface IMonthlyReportResult {
  month: string;
  vehicles: IVehicleReportItem[];
  highest_revenue_vehicle: IVehicleReportItem | null;
}

export class ReportRepository {
  private knex: Knex;

  constructor(knex: Knex) {
    this.knex = knex;
  }

  async getMonthlyReport({
    month,
    vehicle_id,
  }: IMonthlyReportParams): Promise<IMonthlyReportResult> {
    const [yearStr, monthNumStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthNumStr, 10);

    const monthStartStr = `${year}-${String(monthNum).padStart(2, '0')}-01`;
    const lastDay = new Date(year, monthNum, 0).getDate();
    const monthEndStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // 1. Fetch vehicles (active / non-deleted)
    const vehicleQuery = this.knex('vehicles').whereNull('deleted_at');
    if (vehicle_id) {
      vehicleQuery.where('id', vehicle_id);
    }
    const vehiclesList = await vehicleQuery.select('id', 'name', 'plate_number', 'daily_rate');

    if (vehiclesList.length === 0) {
      return {
        month,
        vehicles: [],
        highest_revenue_vehicle: null,
      };
    }

    // 2. Query active rentals overlapping the month using raw SQL
    const bindings: any[] = [monthStartStr, monthEndStr];
    let rawQuery = `
      SELECT 
        r.id as rental_id,
        r.vehicle_id,
        r.start_date,
        r.end_date,
        r.status,
        v.daily_rate
      FROM rentals r
      JOIN vehicles v ON r.vehicle_id = v.id
      WHERE r.status != 'cancelled'
        AND r.start_date <= ?
        AND r.end_date >= ?
    `;

    if (vehicle_id) {
      rawQuery += ` AND r.vehicle_id = ?`;
      bindings.push(vehicle_id);
    }

    const rawResult = await this.knex.raw(rawQuery, bindings);
    const rentalRows = rawResult.rows || rawResult[0] || rawResult;

    // Map to aggregate stats per vehicle
    const vehicleStatsMap: Record<
      number,
      { total_bookings: number; days_rented: number; revenue: number }
    > = {};

    for (const v of vehiclesList) {
      vehicleStatsMap[v.id] = { total_bookings: 0, days_rented: 0, revenue: 0 };
    }

    if (Array.isArray(rentalRows)) {
      for (const row of rentalRows) {
        const vId = Number(row.vehicle_id);
        if (!vehicleStatsMap[vId]) {
          vehicleStatsMap[vId] = { total_bookings: 0, days_rented: 0, revenue: 0 };
        }

        // Format dates as YYYY-MM-DD string
        const rStart =
          typeof row.start_date === 'string'
            ? row.start_date.split('T')[0]
            : new Date(row.start_date).toISOString().split('T')[0];
        const rEnd =
          typeof row.end_date === 'string'
            ? row.end_date.split('T')[0]
            : new Date(row.end_date).toISOString().split('T')[0];

        // Clamp dates inside the requested month
        const clampedStartStr = rStart < monthStartStr ? monthStartStr : rStart;
        const clampedEndStr = rEnd > monthEndStr ? monthEndStr : rEnd;

        const startDateObj = new Date(clampedStartStr);
        const endDateObj = new Date(clampedEndStr);
        const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime());
        const daysInMonth = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const dailyRate = Number(row.daily_rate);
        const revenueInMonth = Number((daysInMonth * dailyRate).toFixed(2));

        vehicleStatsMap[vId].total_bookings += 1;
        vehicleStatsMap[vId].days_rented += daysInMonth;
        vehicleStatsMap[vId].revenue = Number(
          (vehicleStatsMap[vId].revenue + revenueInMonth).toFixed(2),
        );
      }
    }

    // Build vehicle report array
    const vehiclesReport: IVehicleReportItem[] = vehiclesList.map((v) => {
      const stats = vehicleStatsMap[v.id] || { total_bookings: 0, days_rented: 0, revenue: 0 };
      return {
        id: Number(v.id),
        name: v.name,
        plate_number: v.plate_number,
        total_bookings: stats.total_bookings,
        days_rented: stats.days_rented,
        revenue: stats.revenue,
      };
    });

    // Find highest revenue vehicle
    let highestVehicle: IVehicleReportItem | null = null;
    let maxRevenue = 0;

    for (const vItem of vehiclesReport) {
      if (vItem.revenue > maxRevenue) {
        maxRevenue = vItem.revenue;
        highestVehicle = vItem;
      }
    }

    return {
      month,
      vehicles: vehiclesReport,
      highest_revenue_vehicle: highestVehicle,
    };
  }
}
