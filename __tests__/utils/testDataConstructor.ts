import { ExpenseType, IExpense } from "../../src/modules/expense/expense.model";
import { IUser } from "../../src/modules/user/user.model";
import {
  ALT_EMAIL,
  ALT_USERNAME,
  EMAIL,
  NEW_EMAIL,
  NEW_PASSWORD,
  NEW_USERNAME,
  PASSWORD,
  USERNAME,
} from "./testVariables";

export const commonUserBody: IUser = {
  name: USERNAME,
  email: EMAIL,
  password: PASSWORD,
};

export const altUserBody: IUser = {
  name: ALT_USERNAME,
  email: ALT_EMAIL,
  password: PASSWORD,
};

export const updatedUserBody: IUser = {
  name: NEW_USERNAME,
  email: NEW_EMAIL,
  password: NEW_PASSWORD,
};

export const expenseBody: IExpense = {
  amount: 10,
  note: "some notes",
  type: ExpenseType.EXPENSE,
};

export const incomeBody: IExpense = {
  amount: 7,
  note: "lucky seven",
  type: ExpenseType.INCOME,
};

export const updateExpenseBody: IExpense = {
  amount: 17,
  note: "changed notes and type",
  type: ExpenseType.INCOME,
};
