import { RentalRepository } from '../repositories/RentalRepository';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { IRental, IRentalFilters } from '../interfaces/types';
import { Knex } from 'knex';

export class RentalService {
  private rentalRepository: RentalRepository;
  private vehicleRepository: VehicleRepository;

  constructor(rentalRepository: RentalRepository, vehicleRepository: VehicleRepository) {
    this.rentalRepository = rentalRepository;
    this.vehicleRepository = vehicleRepository;
  }

  private formatDateStr(date: string | Date): string {
    if (typeof date === 'string') {
      return date.split('T')[0];
    }
    if (date instanceof Date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return String(date);
  }

  private calculateDays(startDate: string, endDate: string): number {
    const [sY, sM, sD] = startDate.split('-').map((n) => parseInt(n, 10));
    const [eY, eM, eD] = endDate.split('-').map((n) => parseInt(n, 10));
    const startMs = Date.UTC(sY, sM - 1, sD);
    const endMs = Date.UTC(eY, eM - 1, eD);
    const diffDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays + 1; // Same start/end date counts as 1 day
  }

  async getRentals(filters: IRentalFilters) {
    return await this.rentalRepository.findAllWithFilters(filters);
  }

  async getRentalById(id: number): Promise<IRental> {
    const rental = await this.rentalRepository.findById(id);
    if (!rental) {
      throw new Error('Rental not found');
    }
    return rental;
  }

  async createRental(
    rentalData: Omit<IRental, 'id' | 'total_amount'>,
    externalTrx?: Knex.Transaction,
  ): Promise<IRental> {
    const executeInTransaction = async (trx: Knex.Transaction) => {
      const vehicle = await this.vehicleRepository.findActiveById(rentalData.vehicle_id);
      if (!vehicle) {
        throw new Error('Vehicle not found or inactive');
      }

      const formattedStart = this.formatDateStr(rentalData.start_date);
      const formattedEnd = this.formatDateStr(rentalData.end_date);

      if (formattedStart > formattedEnd) {
        const error: any = new Error('End date must be equal to or after start date');
        error.statusCode = 400;
        throw error;
      }

      // Overlap Check Engine inside Transaction
      const isOverlapping = await this.rentalRepository.checkOverlap(
        rentalData.vehicle_id,
        formattedStart,
        formattedEnd,
        undefined,
        trx,
      );

      if (isOverlapping) {
        const error: any = new Error(
          'Vehicle already has an active rental overlapping these dates',
        );
        error.statusCode = 409;
        throw error;
      }

      // Server-side Total Amount Calculation
      const days = this.calculateDays(formattedStart, formattedEnd);
      const total_amount = Number((days * Number(vehicle.daily_rate)).toFixed(2));

      return await this.rentalRepository.create(
        {
          ...rentalData,
          start_date: formattedStart,
          end_date: formattedEnd,
          total_amount,
          status: rentalData.status || 'booked',
        },
        trx,
      );
    };

    if (externalTrx) {
      return await executeInTransaction(externalTrx);
    } else {
      return await this.rentalRepository.getKnex().transaction(executeInTransaction);
    }
  }

  async updateRental(id: number, updateData: Partial<IRental>): Promise<IRental> {
    const existingRental = await this.rentalRepository.findById(id);
    if (!existingRental) {
      throw new Error('Rental not found');
    }

    const startDate = updateData.start_date
      ? this.formatDateStr(updateData.start_date)
      : this.formatDateStr(existingRental.start_date);
    const endDate = updateData.end_date
      ? this.formatDateStr(updateData.end_date)
      : this.formatDateStr(existingRental.end_date);

    if (startDate > endDate) {
      const error: any = new Error('End date must be equal to or after start date');
      error.statusCode = 400;
      throw error;
    }

    const vehicleId = existingRental.vehicle_id;

    // Date changes re-trigger overlap check
    if (updateData.start_date || updateData.end_date) {
      const isOverlapping = await this.rentalRepository.checkOverlap(
        vehicleId,
        startDate,
        endDate,
        id,
      );
      if (isOverlapping) {
        const error: any = new Error('Updated dates conflict with an existing active rental');
        error.statusCode = 409;
        throw error;
      }
    }

    let total_amount = existingRental.total_amount;
    if (updateData.start_date || updateData.end_date) {
      const vehicle = await this.vehicleRepository.findActiveById(vehicleId);
      if (vehicle) {
        const days = this.calculateDays(startDate, endDate);
        total_amount = Number((days * Number(vehicle.daily_rate)).toFixed(2));
      }
    }

    const updated = await this.rentalRepository.update(id, {
      ...updateData,
      start_date: startDate,
      end_date: endDate,
      total_amount,
      updated_at: new Date(),
    });

    if (!updated) {
      throw new Error('Failed to update rental');
    }

    return updated;
  }

  async deleteRental(id: number): Promise<void> {
    const existing = await this.rentalRepository.findById(id);
    if (!existing) {
      throw new Error('Rental not found');
    }

    const success = await this.rentalRepository.delete(id);
    if (!success) {
      throw new Error('Failed to delete rental');
    }
  }
}
