import fs from 'fs';
import path from 'path';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { IVehicle, IVehicleFilters } from '../interfaces/types';

export class VehicleService {
  private vehicleRepository: VehicleRepository;

  constructor(vehicleRepository: VehicleRepository) {
    this.vehicleRepository = vehicleRepository;
  }

  async getVehicles(filters: IVehicleFilters) {
    return await this.vehicleRepository.findAllActive(filters);
  }

  async getVehicleById(id: number): Promise<IVehicle> {
    const vehicle = await this.vehicleRepository.findActiveById(id);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }
    return vehicle;
  }

  async createVehicle(vehicleData: Omit<IVehicle, 'id'>, file?: Express.Multer.File): Promise<IVehicle> {
    const existingPlate = await this.vehicleRepository.findByPlateNumber(vehicleData.plate_number);
    if (existingPlate) {
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path); // Clean up uploaded image if plate exists
      }
      throw new Error('Vehicle with this plate number already exists');
    }

    const photo_path = file ? file.path.replace(/\\/g, '/') : null;

    return await this.vehicleRepository.create({
      ...vehicleData,
      photo_path,
    });
  }

  async updateVehicle(id: number, vehicleData: Partial<IVehicle>, file?: Express.Multer.File): Promise<IVehicle> {
    const existingVehicle = await this.vehicleRepository.findActiveById(id);
    if (!existingVehicle) {
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new Error('Vehicle not found');
    }

    if (vehicleData.plate_number && vehicleData.plate_number !== existingVehicle.plate_number) {
      const duplicatePlate = await this.vehicleRepository.findByPlateNumber(vehicleData.plate_number);
      if (duplicatePlate) {
        if (file && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        throw new Error('Vehicle with this plate number already exists');
      }
    }

    let photo_path = existingVehicle.photo_path;

    if (file) {
      // Remove old photo if a new one is uploaded
      if (existingVehicle.photo_path && fs.existsSync(existingVehicle.photo_path)) {
        try {
          fs.unlinkSync(existingVehicle.photo_path);
        } catch (err) {
          console.error('Failed to remove old photo:', err);
        }
      }
      photo_path = file.path.replace(/\\/g, '/');
    }

    const updated = await this.vehicleRepository.update(id, {
      ...vehicleData,
      photo_path,
      updated_at: new Date(),
    });

    if (!updated) {
      throw new Error('Failed to update vehicle');
    }

    return updated;
  }

  async deleteVehicle(id: number): Promise<void> {
    const existingVehicle = await this.vehicleRepository.findActiveById(id);
    if (!existingVehicle) {
      throw new Error('Vehicle not found');
    }

    const success = await this.vehicleRepository.softDelete(id);
    if (!success) {
      throw new Error('Failed to delete vehicle');
    }
  }
}