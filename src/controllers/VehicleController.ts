import { Request, Response } from 'express';
import { VehicleService } from '../services/VehicleService';

export class VehicleController {
  private vehicleService: VehicleService;

  constructor(vehicleService: VehicleService) {
    this.vehicleService = vehicleService;
  }

  getAllVehicles = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, category, search } = req.query;
      const result = await this.vehicleService.getVehicles({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        category: category as string,
        search: search as string,
      });

      res.status(200).json({
        message: 'Vehicles retrieved successfully',
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to retrieve vehicles' });
    }
  };

  getVehicleById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const vehicle = await this.vehicleService.getVehicleById(id);
      res.status(200).json({
        message: 'Vehicle retrieved successfully',
        data: vehicle,
      });
    } catch (error: any) {
      res.status(440).status(error.message === 'Vehicle not found' ? 404 : 400).json({ message: error.message });
    }
  };

  createVehicle = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, plate_number, category, daily_rate } = req.body;
      const vehicle = await this.vehicleService.createVehicle(
        {
          name,
          plate_number,
          category,
          daily_rate: Number(daily_rate),
        },
        req.file
      );

      res.status(201).json({
        message: 'Vehicle created successfully',
        data: vehicle,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  updateVehicle = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const { name, plate_number, category, daily_rate } = req.body;

      const updateData: any = {};
      if (name) updateData.name = name;
      if (plate_number) updateData.plate_number = plate_number;
      if (category) updateData.category = category;
      if (daily_rate) updateData.daily_rate = Number(daily_rate);

      const vehicle = await this.vehicleService.updateVehicle(id, updateData, req.file);

      res.status(200).json({
        message: 'Vehicle updated successfully',
        data: vehicle,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  deleteVehicle = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      await this.vehicleService.deleteVehicle(id);

      res.status(200).json({
        message: 'Vehicle soft deleted successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Vehicle not found' ? 404 : 400).json({ message: error.message });
    }
  };
}