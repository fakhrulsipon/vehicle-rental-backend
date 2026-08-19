import Joi from 'joi';

export const monthlyReportQuerySchema = Joi.object({
  year: Joi.number().integer().min(2000).max(2100).required().messages({
    'number.base': 'Year must be a number',
    'any.required': 'Year is required',
  }),
  month: Joi.number().integer().min(1).max(12).required().messages({
    'number.base': 'Month must be between 1 and 12',
    'any.required': 'Month is required',
  }),
});