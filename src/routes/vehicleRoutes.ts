import { Router, Request, Response, NextFunction } from 'express';
import db from '../config/database';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { VehicleService } from '../services/VehicleService';
import { VehicleController } from '../controllers/VehicleController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { upload } from '../config/multer';
import { createVehicleSchema, updateVehicleSchema } from '../validations/vehicleValidation';

const router = Router();

const vehicleRepository = new VehicleRepository(db);
const vehicleService = new VehicleService(vehicleRepository);
const vehicleController = new VehicleController(vehicleService);

// Joi validation helper for multipart form-data or JSON
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

// Protect all vehicle routes with JWT Auth
router.use(authenticateJWT);

router.get('/', vehicleController.getAllVehicles);
router.get('/:id', vehicleController.getVehicleById);
router.post('/', upload.single('photo'), validateBody(createVehicleSchema), vehicleController.createVehicle);
router.put('/:id', upload.single('photo'), validateBody(updateVehicleSchema), vehicleController.updateVehicle);
router.delete('/:id', vehicleController.deleteVehicle);

export default router;