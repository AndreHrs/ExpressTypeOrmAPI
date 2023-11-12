import express, { Express } from "express";
import apiRoutes from "./modules/routes";
import { DataSourceOptions } from "typeorm";
import DatabaseManager from "./databaseManager";

class ExpressApp {
  public app: Express;
  public dbManager: DatabaseManager;

  private server: any;

  constructor(datasourceOptions: DataSourceOptions) {
    this.app = express();
    this.dbManager = new DatabaseManager(datasourceOptions);
  }

  public startListening(port: number): void {
    this.server = this.app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  }

  public stopListening(): void {
    if (this.server) {
      this.server.close(() => {});
    }
  }

  private async connectToDb(): Promise<void> {
    try {
      await this.dbManager.initializeDataSource();
    } catch (error) {
      console.log("error");
    }
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    this.app.use("/api/v1", apiRoutes);

    this.app.get("/", async (req, res) => {
      res.send("It works, congratulations");
    });
  }

  public async initializeApp(): Promise<void> {
    await this.connectToDb();
    this.setupMiddleware();
    this.setupRoutes();
  }
}

export default ExpressApp;
