import Expense, { IExpense } from "../../src/modules/expense/expense.model";
import User, { IUser } from "../../src/modules/user/user.model";
import {
  altUserBody,
  commonUserBody,
  expenseBody,
} from "./testDataConstructor";

import { getRepository } from "./testRunner";

export const initializeUser = async (): Promise<User> => {
  return await initializeUserWithBody(commonUserBody);
};

export const initializeAltUser = async (): Promise<User> => {
  return await initializeUserWithBody(altUserBody);
};

export const initializeUserWithBody = async (body: IUser): Promise<User> => {
  let user: User = new User();
  Object.assign(user, body);
  return await getRepository(User).save(user);
};

export const initializeUserAndGetToken = async (): Promise<String> => {
  const user: User = await initializeUser();
  return await user.generateToken();
};

export const initializeUserAndToken = async (): Promise<[User, String]> => {
  const user: User = await initializeUser();
  return [user, await user.generateToken()];
};

export const initializeExpense = async (user: User): Promise<Expense> => {
  return await initializeExpenseWithBody({ ...expenseBody, userId: user.id });
};

export const initializeExpenseWithBody = async (
  body: IExpense
): Promise<Expense> => {
  let expense: Expense = new Expense();
  Object.assign(expense, body);
  return await getRepository(Expense).save(expense);
};
