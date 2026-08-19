import Joi from 'joi';

export const createRentalSchema = Joi.object({
  vehicle_id: Joi.number().integer().positive().required().messages({
    'number.base': 'Vehicle ID must be a number',
    'any.required': 'Vehicle ID is required',
  }),
  customer_name: Joi.string().trim().required().messages({
    'any.required': 'Customer name is required',
  }),
  customer_phone: Joi.string().trim().required().messages({
    'any.required': 'Customer phone is required',
  }),
  start_date: Joi.date().iso().required().messages({
    'date.format': 'Start date must be in YYYY-MM-DD format',
    'any.required': 'Start date is required',
  }),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).required().messages({
    'date.min': 'End date must be equal to or after start date',
    'any.required': 'End date is required',
  }),
});

export const updateRentalSchema = Joi.object({
  customer_name: Joi.string().trim().optional(),
  customer_phone: Joi.string().trim().optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional(),
  status: Joi.string().valid('booked', 'ongoing', 'completed', 'cancelled').optional(),
});