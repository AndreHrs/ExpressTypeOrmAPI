import { Repository } from "typeorm";
import User, { IUser } from "../src/modules/user/user.model";

import request, { Response } from "supertest";

import { commonUserBody, updatedUserBody } from "./utils/testDataConstructor";
import { initializeUser } from "./utils/testDataInitializer";
import {
  cleanUpDatabase,
  getApp,
  getRepository,
  startApp,
  stopApp,
} from "./utils/testRunner";
import {
  EMAIL,
  PASSWORD,
  SHORT_PASSWORD,
  USERNAME,
  WRONG_EMAIL,
} from "./utils/testVariables";

const TEST_NAME = "USER";

beforeAll(async () => {
  await startApp(TEST_NAME);
});

beforeEach(async () => {
  await cleanUpDatabase(User);
});

afterAll(async () => {
  await stopApp();
});

const getUserRepository = (): Repository<User> => {
  return getRepository(User);
};

describe("User Register Test", () => {
  it("should success to register", async () => {
    const response: Response<any> = await request(getApp())
      .post(`/api/v1/users/register`)
      .send(commonUserBody);
    expect(response.statusCode).toBe(201);

    const responseData: any = response.body.data;
    expect(responseData.name).toBe(USERNAME);
    expect(responseData.email).toBe(EMAIL);
    expect(responseData.password).not.toBe(PASSWORD);
    expect(await getUserRepository().count()).toBe(1);
  });

  it("should fail to register with wrong email format", async () => {
    let body: IUser = {
      ...commonUserBody,
      email: WRONG_EMAIL,
      password: SHORT_PASSWORD,
    };

    const response: Response<any> = await request(getApp())
      .post(`/api/v1/users/register`)
      .send(body);
    expect(response.statusCode).toBe(400);

    const responseData: any = response.body.error;
    expect(responseData.password).toContain("should be at least 8 characters");
    expect(responseData.password).toContain(
      "must contain letter, number and symbol"
    );
    expect(responseData.email).toContain("format is not valid");
  });

  it("should fail to register with existing email", async () => {
    await initializeUser();
    expect(await getUserRepository().count()).toBe(1);

    const response: Response<any> = await request(getApp())
      .post(`/api/v1/users/register`)
      .send(commonUserBody);
    expect(response.statusCode).toBe(500);
  });
});

describe("User Login Test", () => {
  it("should login successfully", async () => {
    await initializeUser();

    const response: Response<any> = await request(getApp())
      .post(`/api/v1/users/login`)
      .send({ ...commonUserBody, name: null });
    expect(response.statusCode).toBe(200);

    const responseData: any = response.body.data;
    expect(responseData).not.toHaveProperty("password");
    expect(responseData).toHaveProperty("token");
  });

  it("should fail to login with wrong password", async () => {
    await initializeUser();

    const response: Response<any> = await request(getApp())
      .post(`/api/v1/users/login`)
      .send({ ...commonUserBody, password: SHORT_PASSWORD, name: null });
    expect(response.statusCode).toBe(401);
  });
});

describe("Get own user data", () => {
  it("should get data successfully with token", async () => {
    const user: User = await initializeUser();
    const token: string = await user.generateToken();

    const response: Response<any> = await request(getApp())
      .get(`/api/v1/users`)
      .set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(200);

    const responseData: any = response.body.data;
    expect(responseData.email).toBe(user.email);
    expect(responseData.id).toBe(user.id);
    expect(responseData.name).toBe(user.name);
  });

  it("should fail to get detail without token", async () => {
    await initializeUser();
    const response: Response<any> = await request(getApp()).get(
      `/api/v1/users`
    );

    expect(response.statusCode).toBe(401);
  });
});

describe("Update own user data", () => {
  it("should update data successfully with token", async () => {
    const user: User = await initializeUser();
    const token: string = await user.generateToken();

    const response: Response<any> = await request(getApp())
      .put(`/api/v1/users`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: updatedUserBody.name, password: updatedUserBody.password });
    expect(response.statusCode).toBe(200);

    const userInDb: User | null = await getUserRepository().findOneBy({
      id: user.id,
    });
    if (userInDb) {
      expect(userInDb.email).toBe(commonUserBody.email);
      expect(userInDb.name).toBe(updatedUserBody.name);
      expect(userInDb.password).not.toBe(user.password);
    } else {
      throw new Error(`user with ID ${user.id} not found in the database`);
    }
  });

  it("should not allow any update with email", async () => {
    const user: User = await initializeUser();
    const token: string = await user.generateToken();

    let newBody: IUser = updatedUserBody;
    const response: Response<any> = await request(getApp())
      .put(`/api/v1/users`)
      .set("Authorization", `Bearer ${token}`)
      .send(newBody);

    expect(response.statusCode).toBe(400);
    const responseData: any = response.body.error;
    expect(responseData.email).toContain("email is not allowed");
  });

  it("should fail to update data without token", async () => {
    await initializeUser();
    let newBody: IUser = updatedUserBody;
    const response: Response<any> = await request(getApp())
      .put(`/api/v1/users`)
      .send(newBody);

    expect(response.statusCode).toBe(401);
  });
});
