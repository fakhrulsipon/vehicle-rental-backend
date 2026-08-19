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

  private calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

  async createRental(rentalData: Omit<IRental, 'id' | 'total_amount'>, trx?: Knex.Transaction): Promise<IRental> {
    const vehicle = await this.vehicleRepository.findActiveById(rentalData.vehicle_id);
    if (!vehicle) {
      throw new Error('Vehicle not found or inactive');
    }

    const formattedStart = new Date(rentalData.start_date).toISOString().split('T')[0];
    const formattedEnd = new Date(rentalData.end_date).toISOString().split('T')[0];

    // Overlap Check Engine
    const isOverlapping = await this.rentalRepository.checkOverlap(
      rentalData.vehicle_id,
      formattedStart,
      formattedEnd,
      undefined,
      trx
    );

    if (isOverlapping) {
      const error: any = new Error('Vehicle already has an active rental overlapping these dates');
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
      trx
    );
  }

  async updateRental(id: number, updateData: Partial<IRental>): Promise<IRental> {
    const existingRental = await this.rentalRepository.findById(id);
    if (!existingRental) {
      throw new Error('Rental not found');
    }

    const startDate = updateData.start_date
      ? new Date(updateData.start_date).toISOString().split('T')[0]
      : existingRental.start_date;
    const endDate = updateData.end_date
      ? new Date(updateData.end_date).toISOString().split('T')[0]
      : existingRental.end_date;

    const vehicleId = existingRental.vehicle_id;

    // Date changes re-trigger overlap check
    if (updateData.start_date || updateData.end_date) {
      const isOverlapping = await this.rentalRepository.checkOverlap(vehicleId, startDate, endDate, id);
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