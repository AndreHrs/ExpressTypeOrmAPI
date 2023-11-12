import dotenv from "dotenv";

// Load environment variables from .env file
if (process.env.NODE_ENV == "production") {
  dotenv.config({ path: ".env.prod" });
} else {
  dotenv.config();
}

import { DataSourceOptions } from "typeorm";
import { createExpressAppInstance, getExpressAppInstance } from "./appInstance";

// Read the port from environment variables or use a default port
const port: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Initialize data source option
const datasourceOptions: DataSourceOptions = {
  type: "mysql",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize:
    process.env.DB_SYNCHRONIZE &&
    process.env.DB_SYNCHRONIZE.toLowerCase() === "true",
  logging:
    process.env.DB_LOGGING && process.env.DB_LOGGING.toLowerCase() === "true",
};

const initAppAndListen = async () => {
  let expressApp = getExpressAppInstance();

  if (!expressApp) {
    expressApp = createExpressAppInstance(datasourceOptions);
    await expressApp.initializeApp();
  }

  await expressApp.startListening(port);
};

initAppAndListen();
