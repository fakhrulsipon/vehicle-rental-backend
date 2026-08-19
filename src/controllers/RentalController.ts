import { Request, Response } from 'express';
import { RentalService } from '../services/RentalService';

export class RentalController {
  private rentalService: RentalService;

  constructor(rentalService: RentalService) {
    this.rentalService = rentalService;
  }

  getAllRentals = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, vehicle_id, status, start_date, end_date } = req.query;

      const result = await this.rentalService.getRentals({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        vehicle_id: vehicle_id ? Number(vehicle_id) : undefined,
        status: status as string,
        start_date: start_date as string,
        end_date: end_date as string,
      });

      res.status(200).json({
        message: 'Rentals retrieved successfully',
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to retrieve rentals' });
    }
  };

  getRentalById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const rental = await this.rentalService.getRentalById(id);
      res.status(200).json({
        message: 'Rental retrieved successfully',
        data: rental,
      });
    } catch (error: any) {
      res.status(error.message === 'Rental not found' ? 404 : 400).json({ message: error.message });
    }
  };

  createRental = async (req: Request, res: Response): Promise<void> => {
    try {
      const rental = await this.rentalService.createRental(req.body);
      res.status(201).json({
        message: 'Rental created successfully',
        data: rental,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({ message: error.message });
    }
  };

  updateRental = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const rental = await this.rentalService.updateRental(id, req.body);
      res.status(200).json({
        message: 'Rental updated successfully',
        data: rental,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || (error.message === 'Rental not found' ? 404 : 400);
      res.status(statusCode).json({ message: error.message });
    }
  };

  deleteRental = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      await this.rentalService.deleteRental(id);
      res.status(200).json({ message: 'Rental deleted successfully' });
    } catch (error: any) {
      res.status(error.message === 'Rental not found' ? 404 : 400).json({ message: error.message });
    }
  };
}
