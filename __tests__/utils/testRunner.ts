import { Express } from "express";
import {
  BaseEntity,
  DataSourceOptions,
  DeleteResult,
  Repository,
} from "typeorm";
import ExpressApp from "../../src/app";
import {
  createExpressAppInstance,
  getExpressAppInstance,
} from "../../src/appInstance";
import DatabaseManager from "../../src/databaseManager";

export let expressApp: ExpressApp;

export const startApp = async (testName: String) => {
  const datasourceOptions: DataSourceOptions = {
    type: "mysql",
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: (process.env.DB_NAME as string) + testName,
    synchronize: true,
  };

  // Create or get the existing ExpressApp instance
  expressApp = createExpressAppInstance(datasourceOptions);

  await expressApp.initializeApp();

  // Generate a random port from 3000 - 8000
  const min = 3000;
  const max = 8000;

  const port = Math.floor(Math.random() * (max - min + 1)) + min;
  expressApp.startListening(port);
};

export const stopApp = async () => {
  await expressApp.stopListening();
  await getDatabaseManager().disconnectDataSource();
  await getDatabaseManager().dropDatabaseIfExists();
};

export const getDatabaseManager = (): DatabaseManager => {
  return getExpressAppInstance().dbManager;
};

export const getRepository = <T extends BaseEntity>(
  entity: new () => T
): Repository<T> => {
  return getDatabaseManager().getDataSource().getRepository(entity);
};

export const getApp = (): Express => {
  return expressApp.app;
};

export const cleanUpDatabase = async <T extends BaseEntity>(
  entity: new () => T
): Promise<DeleteResult> => {
  return getRepository(entity)
    .createQueryBuilder()
    .delete()
    .from(entity)
    .execute();
};
