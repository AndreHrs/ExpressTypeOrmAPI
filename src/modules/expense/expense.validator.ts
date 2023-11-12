import Joi, { ObjectSchema, ValidationErrorItem } from "joi";
import User from "../user/user.model";
import { ExpenseType } from "./expense.model";

const validatorSchema: any = {
  userId: Joi.number()
    .external(async (value: any, helpers: any) => {
      if (!(await User.findOneBy({ id: parseInt(value) }))) {
        const errorDetails: ValidationErrorItem[] = [
          {
            message: "user is not valid",
            path: ["user"],
            type: "any.invalid",
          },
        ];
        const error: Joi.ValidationError = new Joi.ValidationError(
          "user is not valid",
          errorDetails,
          value
        );
        throw error;
      }
      return value;
    })
    .required()
    .messages({
      "any.invalid": "user is not valid",
      "any.required": "is required",
    }),
  amount: Joi.number(),
  note: Joi.string().optional(),
  type: Joi.string()
    .valid(...Object.values(ExpenseType))
    .required()
    .messages({
      "any.invalid": "expense type invalid",
      "any.required": "is required",
    }),
};

export const createExpenseValidator: ObjectSchema<any> = Joi.object(
  validatorSchema
).options({ stripUnknown: true });
