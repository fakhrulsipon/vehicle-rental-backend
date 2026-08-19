import Joi from 'joi';

export const monthlyReportQuerySchema = Joi.object({
  month: Joi.string()
    .pattern(/^\d{4}-(0[1-9]|1[0-2])$/)
    .required()
    .messages({
      'string.pattern.base': 'Month must be in YYYY-MM format (e.g., 2026-08)',
      'any.required': 'Month parameter is required (format: YYYY-MM)',
    }),
  vehicle_id: Joi.number().integer().positive().optional().messages({
    'number.base': 'Vehicle ID must be a number',
  }),
});
