import Joi from 'joi';

export const createVehicleSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'any.required': 'Vehicle name is required',
  }),
  plate_number: Joi.string().trim().required().messages({
    'any.required': 'Plate number is required',
  }),
  category: Joi.string().trim().required().messages({
    'any.required': 'Category is required',
  }),
  daily_rate: Joi.number().positive().required().messages({
    'number.positive': 'Daily rate must be a positive number',
    'any.required': 'Daily rate is required',
  }),
});

export const updateVehicleSchema = Joi.object({
  name: Joi.string().trim().optional(),
  plate_number: Joi.string().trim().optional(),
  category: Joi.string().trim().optional(),
  daily_rate: Joi.number().positive().optional(),
});