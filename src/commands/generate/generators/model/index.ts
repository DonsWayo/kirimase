import { DBType } from "../../../../types.js";
import { createFile, readConfigFile } from "../../../../utils.js";
import { prismaFormat, prismaGenerate } from "../../../add/orm/utils.js";
import { ExtendedSchema } from "../../types.js";
import { toCamelCase } from "../../utils.js";
import { generateMutationContent } from "./mutations/index.js";
import { generateQueryContent } from "./queries/index.js";
import { generateModelContent } from "./schema/index.js";
import {
  formatFilePath,
  generateServiceFileNames,
  getFilePaths,
} from "../../../filePaths/index.js";
import { updateRootSchema } from "./utils.js";

export async function scaffoldModel(schema: ExtendedSchema, dbType: DBType) {
  const { tableName } = schema;
  const { orm, preferredPackageManager, driver } = readConfigFile();
  const { shared } = getFilePaths();
  const serviceFileNames = generateServiceFileNames(toCamelCase(tableName));

  const modelPath = `${formatFilePath(shared.orm.schemaDir, {
    prefix: "rootPath",
    removeExtension: false,
  })}/${toCamelCase(tableName)}.ts`;
  await createFile(modelPath, await generateModelContent(schema, dbType));

  if (orm === "drizzle") {
    await updateRootSchema(tableName);
  }

  if (orm === "prisma") {
    await prismaFormat(preferredPackageManager);
    await prismaGenerate(preferredPackageManager);
  }

  // create queryFile
  await createFile(
    serviceFileNames.queriesPath,
    generateQueryContent(schema, orm)
  );

  // create mutationFile
  await createFile(
    serviceFileNames.mutationsPath,
    generateMutationContent(schema, driver, orm)
  );
}
