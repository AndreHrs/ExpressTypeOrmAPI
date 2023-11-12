import fs from "fs/promises";
import path from "path";

const baseDirectory = __dirname;

export async function importModels(
  directoryPath?: string
): Promise<Function[]> {
  try {
    if (!directoryPath) {
      directoryPath = baseDirectory;
    }
    const entries = await fs.readdir(directoryPath);
    const entities: Function[] = [];

    for (const entry of entries) {
      const entryPath = path.join(directoryPath, entry);
      const entryStat = await fs.stat(entryPath);
      if (entryStat.isFile() && entry.endsWith(".model.ts")) {
        const moduleExport = await import(entryPath);
        if (
          moduleExport.default &&
          typeof moduleExport.default === "function"
        ) {
          entities.push(moduleExport.default);
        }
      } else if (entryStat.isDirectory()) {
        const subEntities = await importModels(entryPath);
        entities.push(...subEntities);
      }
    }

    return entities;
  } catch (error) {
    console.error("Error importing models:", error);
    throw error;
  }
}
