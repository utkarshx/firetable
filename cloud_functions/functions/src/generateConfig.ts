const fs = require("fs");
// Initialize Firebase Admin
import * as admin from "firebase-admin";
// Initialize Firebase Admin
//const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

const serviceAccount = requireIfExists("../firebase-credentials.json");

function requireIfExists(module) {
  try {
    return require(module);
  } catch (error) {
    console.log("serviceAccount json not found");
    return false;
  }
}
if (serviceAccount) {
  console.log(`Running on ${serviceAccount.project_id}`);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
  });

  const db = admin.firestore();
  const main = async (functionType: string, configString: string) => {
    let configData;
    switch (functionType) {
      case "FT_derivatives":
        const schemaDoc = await db
          .doc(`_FIRETABLE_/settings/schema/${configString}`)
          .get();
        const schemaData = schemaDoc.data();
        if (!schemaData) return;
        const derivativeColumns = Object.values(schemaData.columns).filter(
          (col: any) => col.type === "DERIVATIVE"
        );
        console.log(derivativeColumns);

        const config = derivativeColumns.reduce((acc, currColumn: any) => {
          return `${acc}{
            fieldName:'${currColumn.key}',eval:(db)=> async (row) =>{${
            currColumn.config.script
          }},listenerFields:[${currColumn.config.listenerFields
            .map((f) => `"${f}"`)
            .join(",")}]},`;
        }, ``);

        configData = `export default [${config}]\nexport const collectionPath ="${configString}"`;
        break;

      case "FT_subTableStats":
        configData = `export const collectionPath ="${configString}"\nexport default []`;
        break;
      default:
        configData = `export default ${configString}\n export const collectionPath=''`;
        break;
    }
    fs.writeFileSync("./src/functionConfig.ts", configData);
    return;
  };

  main(process.argv[2], process.argv[3])
    .catch((err) => console.log(err))
    .then(() => console.log("this will succeed"))
    .catch(() => "obligatory catch");
} else {
  console.log("did not run generator");
}
