import { Repository } from "typeorm";
import Expense, { IExpense } from "../src/modules/expense/expense.model";
import User from "../src/modules/user/user.model";

import request, { Response } from "supertest";

import { expenseBody, updateExpenseBody } from "./utils/testDataConstructor";
import {
  initializeAltUser,
  initializeExpense,
  initializeUserAndToken,
} from "./utils/testDataInitializer";
import {
  cleanUpDatabase,
  getApp,
  getRepository,
  startApp,
  stopApp,
} from "./utils/testRunner";

const TEST_NAME = "EXPENSE";

beforeAll(async () => {
  await startApp(TEST_NAME);
});

beforeEach(async () => {
  await cleanUpDatabase(Expense);
  await cleanUpDatabase(User);
});

afterAll(async () => {
  await stopApp();
});

const getUserRepository = (): Repository<User> => {
  return getRepository(User);
};

const getExpenseRepository = (): Repository<Expense> => {
  return getRepository(Expense);
};

const initializeMultipleExpenses = async (user: User): Promise<Expense[]> => {
  let expenses: Expense[] = [];

  for (let index = 0; index < 5; index++) {
    let tempBody: IExpense = expenseBody;
    let tempExpense: Expense = new Expense();
    Object.assign(tempExpense, {
      ...tempBody,
      amount: tempBody.amount + index,
      userId: user.id,
    });
    expenses.push(tempExpense);
  }

  return await getExpenseRepository().save(expenses);
};

describe("Expense Creation Test", () => {
  it("should success to create expense", async () => {
    const userAndToken: [User, String] = await initializeUserAndToken();
    const response: Response<any> = await request(getApp())
      .post(`/api/v1/expenses`)
      .set("Authorization", `Bearer ${userAndToken[1]}`)
      .send(expenseBody);
    expect(response.statusCode).toBe(201);

    const responseData: any = response.body.data;
    expect(await getExpenseRepository().count()).toBe(1);

    const expenseInDb: Expense[] = await getExpenseRepository().findBy({});
    let expense: Expense = expenseInDb[0];

    expect(expense.amount).toBe(expenseBody.amount);
    expect(expense.note).toBe(expenseBody.note);
    expect(expense.type).toBe(expenseBody.type);
  });

  it("should fail to create expense without token", async () => {
    const userAndToken: [User, String] = await initializeUserAndToken();
    const response: Response<any> = await request(getApp())
      .post(`/api/v1/expenses`)
      .send(expenseBody);
    expect(response.statusCode).toBe(401);

    expect(await getExpenseRepository().count()).toBe(0);
  });

  it("should validate type", async () => {
    const userAndToken: [User, String] = await initializeUserAndToken();
    const response: Response<any> = await request(getApp())
      .post(`/api/v1/expenses`)
      .set("Authorization", `Bearer ${userAndToken[1]}`)
      .send({ ...expenseBody, type: "nothing" });
    expect(response.statusCode).toBe(400);

    const responseData: any = response.body.error;
    expect(responseData.type).toContain(
      "type must be one of [expense, income]"
    );

    expect(await getExpenseRepository().count()).toBe(0);
  });

  it("should validate amount", async () => {
    const userAndToken: [User, String] = await initializeUserAndToken();
    const response: Response<any> = await request(getApp())
      .post(`/api/v1/expenses`)
      .set("Authorization", `Bearer ${userAndToken[1]}`)
      .send({ ...expenseBody, amount: "a" });
    expect(response.statusCode).toBe(400);

    const responseData: any = response.body.error;
    expect(responseData.amount).toContain("amount must be a number");

    expect(await getExpenseRepository().count()).toBe(0);
  });
});

describe("Get All Expenses Test", () => {
  it("should success to create expense and not get other user's expenses", async () => {
    const userAndToken: [User, String] = await initializeUserAndToken();
    await initializeMultipleExpenses(userAndToken[0]);

    const altUser: User = await initializeAltUser();
    await initializeMultipleExpenses(altUser);

    expect(await getExpenseRepository().count()).toBe(10);

    const response: Response<any> = await request(getApp())
      .get(`/api/v1/expenses`)
      .set("Authorization", `Bearer ${userAndToken[1]}`);
    expect(response.statusCode).toBe(200);

    const responseData: any = response.body.data;
    expect(responseData.length).toBe(5);

    responseData.forEach((expense) => {
      expect(expense.userId).toBe(userAndToken[0].id);
    });

    const altResponse: Response<any> = await request(getApp())
      .get(`/api/v1/expenses`)
      .set("Authorization", `Bearer ${await altUser.generateToken()}`);
    expect(altResponse.statusCode).toBe(200);

    const altResponseData: any = altResponse.body.data;
    expect(responseData.length).toBe(5);

    altResponseData.forEach((expense) => {
      expect(expense.userId).toBe(altUser.id);
    });
  });

  it("should fail to get expenses without token", async () => {
    const userAndToken: [User, String] = await initializeUserAndToken();
    await initializeMultipleExpenses(userAndToken[0]);

    const altUser: User = await initializeAltUser();
    await initializeMultipleExpenses(altUser);

    expect(await getExpenseRepository().count()).toBe(10);

    const response: Response<any> = await request(getApp()).get(
      `/api/v1/expenses`
    );
    expect(response.statusCode).toBe(401);
  });
});

describe("Get Single Expense Test", () => {
  it("should success to create expense and not get other user's expenses", async () => {
    const userAndToken: [User, String] = await initializeUserAndToken();
    const expense: Expense = await initializeExpense(userAndToken[0]);

    expect(await getExpenseRepository().count()).toBe(1);

    const response: Response<any> = await request(getApp())
      .get(`/api/v1/expenses/${expense.id}`)
      .set("Authorization", `Bearer ${userAndToken[1]}`);
    expect(response.statusCode).toBe(200);

    const responseData: any = response.body.data;
    expect(responseData.userId).toBe(userAndToken[0].id);
    expect(responseData.amount).toBe(expenseBody.amount);
    expect(responseData.note).toBe(expenseBody.note);
    expect(responseData.type).toBe(expenseBody.type);
  });

  it("should fail to get expense without access token", async () => {
    const userAndToken: [User, String] = await initializeUserAndToken();
    const expense: Expense = await initializeExpense(userAndToken[0]);

    expect(await getExpenseRepository().count()).toBe(1);

    const response: Response<any> = await request(getApp()).get(
      `/api/v1/expenses/${expense.id}`
    );
    expect(response.statusCode).toBe(401);
  });

  it("should be forbidden when accessing other user's expense", async () => {
    const userAndToken: [User, String] = await initializeUserAndToken();
    const expense: Expense = await initializeExpense(userAndToken[0]);

    const altUser: User = await initializeAltUser();

    expect(await getExpenseRepository().count()).toBe(1);

    const response: Response<any> = await request(getApp())
      .get(`/api/v1/expenses/${expense.id}`)
      .set("Authorization", `Bearer ${await altUser.generateToken()}`);
    expect(response.statusCode).toBe(403);
  });
});

describe("Update Expense Test", () => {
  it("should success to update own expense", async () => {
    const userAndToken: [User, String] = await initializeUserAndToken();
    const expense: Expense = await initializeExpense(userAndToken[0]);

    expect(await getExpenseRepository().count()).toBe(1);

    const response: Response<any> = await request(getApp())
      .put(`/api/v1/expenses/${expense.id}`)
      .set("Authorization", `Bearer ${userAndToken[1]}`)
      .send(updateExpenseBody);
    expect(response.statusCode).toBe(200);

    const responseData: any = response.body.data;
    expect(responseData.amount).toBe(updateExpenseBody.amount);
    expect(responseData.note).toBe(updateExpenseBody.note);
    expect(responseData.type).toBe(updateExpenseBody.type);

    const expenseInDb: Expense | null = await getExpenseRepository().findOneBy({
      id: expense.id,
    });
    if (expenseInDb) {
      expect(expenseInDb.amount).toBe(updateExpenseBody.amount);
      expect(expenseInDb.note).toBe(updateExpenseBody.note);
      expect(expenseInDb.type).toBe(updateExpenseBody.type);
    }
  });

  it("update should not be able to change userId", async () => {
    const userAndToken: [User, String] = await initializeUserAndToken();
    const expense: Expense = await initializeExpense(userAndToken[0]);

    const altUser: User = await initializeAltUser();

    expect(await getExpenseRepository().count()).toBe(1);

    const response: Response<any> = await request(getApp())
      .put(`/api/v1/expenses/${expense.id}`)
      .set("Authorization", `Bearer ${userAndToken[1]}`)
      .send({ ...updateExpenseBody, userId: altUser.id });
    expect(response.statusCode).toBe(200);

    const responseData: any = response.body.data;
    expect(responseData.amount).toBe(updateExpenseBody.amount);
    expect(responseData.note).toBe(updateExpenseBody.note);
    expect(responseData.type).toBe(updateExpenseBody.type);

    const expenseInDb: Expense | null = await getExpenseRepository().findOneBy({
      id: expense.id,
    });
    if (expenseInDb) {
      expect(expenseInDb.amount).toBe(updateExpenseBody.amount);
      expect(expenseInDb.note).toBe(updateExpenseBody.note);
      expect(expenseInDb.type).toBe(updateExpenseBody.type);
      expect(expenseInDb.userId).toBe(userAndToken[0].id);
    }
  });

  it("should fail to update expense without access token", async () => {
    const userAndToken: [User, String] = await initializeUserAndToken();
    const expense: Expense = await initializeExpense(userAndToken[0]);

    expect(await getExpenseRepository().count()).toBe(1);

    const response: Response<any> = await request(getApp())
      .put(`/api/v1/expenses/${expense.id}`)
      .send(updateExpenseBody);
    expect(response.statusCode).toBe(401);
  });

  it("should be forbidden when updating other user's expense", async () => {
    const userAndToken: [User, String] = await initializeUserAndToken();
    const expense: Expense = await initializeExpense(userAndToken[0]);

    const altUser: User = await initializeAltUser();

    expect(await getExpenseRepository().count()).toBe(1);

    const response: Response<any> = await request(getApp())
      .put(`/api/v1/expenses/${expense.id}`)
      .set("Authorization", `Bearer ${await altUser.generateToken()}`)
      .send(updateExpenseBody);
    expect(response.statusCode).toBe(403);
  });
});

describe("Delete Expense Test", () => {
  it("should success to delete own expense", async () => {
    const userAndToken: [User, String] = await initializeUserAndToken();
    const expense: Expense = await initializeExpense(userAndToken[0]);

    expect(await getExpenseRepository().count()).toBe(1);

    const response: Response<any> = await request(getApp())
      .delete(`/api/v1/expenses/${expense.id}`)
      .set("Authorization", `Bearer ${userAndToken[1]}`);
    expect(response.statusCode).toBe(200);

    const responseData: any = response.body.data;
    expect(responseData.userId).toBe(userAndToken[0].id);
    expect(responseData.amount).toBe(expenseBody.amount);
    expect(responseData.note).toBe(expenseBody.note);
    expect(responseData.type).toBe(expenseBody.type);

    expect(await getExpenseRepository().count()).toBe(0);
  });

  it("should fail to delete expense without access token", async () => {
    const userAndToken: [User, String] = await initializeUserAndToken();
    const expense: Expense = await initializeExpense(userAndToken[0]);

    expect(await getExpenseRepository().count()).toBe(1);

    const response: Response<any> = await request(getApp()).delete(
      `/api/v1/expenses/${expense.id}`
    );
    expect(response.statusCode).toBe(401);

    expect(await getExpenseRepository().count()).toBe(1);
  });

  it("should be forbidden when trying to delete other user's expense", async () => {
    const userAndToken: [User, String] = await initializeUserAndToken();
    const expense: Expense = await initializeExpense(userAndToken[0]);

    const altUser: User = await initializeAltUser();

    expect(await getExpenseRepository().count()).toBe(1);

    const response: Response<any> = await request(getApp())
      .delete(`/api/v1/expenses/${expense.id}`)
      .set("Authorization", `Bearer ${await altUser.generateToken()}`);
    expect(response.statusCode).toBe(403);

    expect(await getExpenseRepository().count()).toBe(1);
  });
});
