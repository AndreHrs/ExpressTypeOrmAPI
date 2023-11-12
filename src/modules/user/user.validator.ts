import Joi from "joi";

export const createUserValidator = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "is required",
  }),
  email: Joi.string().required().email().messages({
    "any.required": "is required",
    "string.email": "format is not valid",
  }),
  password: Joi.string()
    .required()
    .min(8)
    .messages({
      "any.required": "is required",
      "string.min": "should be at least 8 characters",
      "string.pattern.base": "must contain letter, number and symbol",
    })
    .pattern(new RegExp(/^(?=.*[A-Z])(?=.*\d)(?=.*\W).+/)),
});

export const updateUserValidator = Joi.object({
  name: Joi.string().optional().messages({
    "any.required": "is required",
  }),
  password: Joi.string()
    .optional()
    .min(8)
    .messages({
      "any.required": "is required",
      "string.min": "should be at least 8 characters",
      "string.pattern.base": "must contain letter, number and symbol",
    })
    .pattern(new RegExp(/^(?=.*[A-Z])(?=.*\d)(?=.*\W).+/)),
});
