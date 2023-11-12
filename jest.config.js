const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config({ path: ".env.test" });

process.env.NODE_ENV = "TEST";

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["dotenv/config"],
  modulePathIgnorePatterns: ["utils", "ignored"],
};
