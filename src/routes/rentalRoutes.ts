import { Router, Request, Response, NextFunction } from 'express';
import db from '../config/database';
import { RentalRepository } from '../repositories/RentalRepository';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { RentalService } from '../services/RentalService';
import { RentalController } from '../controllers/RentalController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { createRentalSchema, updateRentalSchema } from '../validations/rentalValidation';

const router = Router();

const rentalRepository = new RentalRepository(db);
const vehicleRepository = new VehicleRepository(db);
const rentalService = new RentalService(rentalRepository, vehicleRepository);
const rentalController = new RentalController(rentalService);

const validateBody = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ message: error.details[0].message });
      return;
    }
    next();
  };
};

// All rental routes protected by JWT
router.use(authenticateJWT);

router.get('/', rentalController.getAllRentals);
router.get('/:id', rentalController.getRentalById);
router.post('/', validateBody(createRentalSchema), rentalController.createRental);
router.put('/:id', validateBody(updateRentalSchema), rentalController.updateRental);
router.delete('/:id', rentalController.deleteRental);

export default router;
