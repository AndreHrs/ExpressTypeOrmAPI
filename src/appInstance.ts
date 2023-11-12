import { DataSourceOptions } from "typeorm";
import ExpressApp from "./app";

let expressAppInstance: ExpressApp;

export const createExpressAppInstance = (
  datasourceOptions: DataSourceOptions
): ExpressApp => {
  expressAppInstance = new ExpressApp(datasourceOptions);
  return expressAppInstance;
};

export const getExpressAppInstance = (): ExpressApp => expressAppInstance;
