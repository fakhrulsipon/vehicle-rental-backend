import { RentalService } from '../services/RentalService';
import { ReportRepository } from '../repositories/ReportRepository';

describe('Business Logic Unit Tests', () => {
  describe('RentalService Date & Day Calculation Logic', () => {
    let mockRentalRepo: any;
    let mockVehicleRepo: any;
    let rentalService: RentalService;

    beforeEach(() => {
      mockRentalRepo = {
        checkOverlap: jest.fn(),
        create: jest.fn(),
        findById: jest.fn(),
        update: jest.fn(),
        getKnex: jest.fn().mockReturnValue({
          transaction: (cb: any) => cb({}),
        }),
      };
      mockVehicleRepo = {
        findActiveById: jest.fn(),
      };
      rentalService = new RentalService(mockRentalRepo, mockVehicleRepo);
    });

    it('should calculate correct total amount for same day rental (1 day)', async () => {
      mockVehicleRepo.findActiveById.mockResolvedValue({ id: 1, daily_rate: 100 });
      mockRentalRepo.checkOverlap.mockResolvedValue(false);
      mockRentalRepo.create.mockImplementation((data: any) => Promise.resolve({ id: 10, ...data }));

      const rental = await rentalService.createRental({
        vehicle_id: 1,
        customer_name: 'Test Customer',
        customer_phone: '1234567890',
        start_date: '2026-08-10',
        end_date: '2026-08-10',
      });

      expect(rental.total_amount).toBe(100.0); // 1 day * $100
      expect(rental.start_date).toBe('2026-08-10');
      expect(rental.end_date).toBe('2026-08-10');
    });

    it('should calculate correct total amount for multi-day rental', async () => {
      mockVehicleRepo.findActiveById.mockResolvedValue({ id: 1, daily_rate: 50 });
      mockRentalRepo.checkOverlap.mockResolvedValue(false);
      mockRentalRepo.create.mockImplementation((data: any) => Promise.resolve({ id: 11, ...data }));

      const rental = await rentalService.createRental({
        vehicle_id: 1,
        customer_name: 'Test Customer',
        customer_phone: '1234567890',
        start_date: '2026-08-10',
        end_date: '2026-08-15',
      });

      // Aug 10 to Aug 15 = 6 days (10, 11, 12, 13, 14, 15)
      expect(rental.total_amount).toBe(300.0); // 6 days * $50
    });

    it('should throw 409 error if vehicle already has an overlapping active rental', async () => {
      mockVehicleRepo.findActiveById.mockResolvedValue({ id: 1, daily_rate: 50 });
      mockRentalRepo.checkOverlap.mockResolvedValue(true); // Overlap detected!

      await expect(
        rentalService.createRental({
          vehicle_id: 1,
          customer_name: 'Test Customer',
          customer_phone: '1234567890',
          start_date: '2026-08-10',
          end_date: '2026-08-15',
        }),
      ).rejects.toMatchObject({
        message: 'Vehicle already has an active rental overlapping these dates',
        statusCode: 409,
      });
    });

    it('should throw 400 error if end_date is before start_date', async () => {
      mockVehicleRepo.findActiveById.mockResolvedValue({ id: 1, daily_rate: 50 });

      await expect(
        rentalService.createRental({
          vehicle_id: 1,
          customer_name: 'Test Customer',
          customer_phone: '1234567890',
          start_date: '2026-08-15',
          end_date: '2026-08-10',
        }),
      ).rejects.toMatchObject({
        message: 'End date must be equal to or after start date',
        statusCode: 400,
      });
    });
  });

  describe('ReportRepository Calculation Logic', () => {
    it('should correctly clamp month boundary rental days and calculate vehicle revenue', async () => {
      const mockKnex: any = (table: string) => {
        if (table === 'vehicles') {
          return {
            whereNull: () => ({
              select: () =>
                Promise.resolve([
                  { id: 1, name: 'Toyota Corolla', plate_number: 'DHAKA-11', daily_rate: 50.0 },
                  { id: 2, name: 'Honda CR-V', plate_number: 'DHAKA-22', daily_rate: 80.0 },
                ]),
            }),
          };
        }
        return {};
      };

      // Raw SQL query mock return
      mockKnex.raw = jest.fn().mockResolvedValue({
        rows: [
          // Rental 1: July 29 to Aug 3 (Spans July & Aug). Daily rate 50.
          // Should contribute 3 days (Aug 1, Aug 2, Aug 3) to Aug report => $150
          {
            rental_id: 1,
            vehicle_id: 1,
            start_date: '2026-07-29',
            end_date: '2026-08-03',
            status: 'ongoing',
            daily_rate: 50.0,
          },
          // Rental 2: Aug 10 to Aug 15 (Inside Aug). Daily rate 80.
          // Should contribute 6 days to Aug report => $480
          {
            rental_id: 2,
            vehicle_id: 2,
            start_date: '2026-08-10',
            end_date: '2026-08-15',
            status: 'booked',
            daily_rate: 80.0,
          },
        ],
      });

      const reportRepo = new ReportRepository(mockKnex);
      const report = await reportRepo.getMonthlyReport({ month: '2026-08' });

      expect(report.month).toBe('2026-08');
      expect(report.vehicles).toHaveLength(2);

      const vehicle1Report = report.vehicles.find((v) => v.id === 1);
      expect(vehicle1Report).toBeDefined();
      expect(vehicle1Report?.total_bookings).toBe(1);
      expect(vehicle1Report?.days_rented).toBe(3); // July 29 - Aug 3 -> 3 days inside Aug
      expect(vehicle1Report?.revenue).toBe(150.0);

      const vehicle2Report = report.vehicles.find((v) => v.id === 2);
      expect(vehicle2Report).toBeDefined();
      expect(vehicle2Report?.total_bookings).toBe(1);
      expect(vehicle2Report?.days_rented).toBe(6); // Aug 10 - Aug 15 -> 6 days inside Aug
      expect(vehicle2Report?.revenue).toBe(480.0);

      // Highest revenue vehicle should be Vehicle 2 ($480 > $150)
      expect(report.highest_revenue_vehicle).not.toBeNull();
      expect(report.highest_revenue_vehicle?.id).toBe(2);
      expect(report.highest_revenue_vehicle?.revenue).toBe(480.0);
    });
  });
});
