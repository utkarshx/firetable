import * as functions from "firebase-functions";
import * as _ from "lodash";
import { db, auth } from "../config";
import * as admin from "firebase-admin";
import utilFns from "../utils";
type ActionData = {
  ref: {
    id: string;
    path: string;
    parentId: string;
    tablePath: string;
  };
  row: any;
  column: any;
  action: "run" | "redo" | "undo";
};
// import {
//   makeId,
//   hasGoogleMailServer,
//   hasMissingFields,
// } from "../utils";

import { hasAnyRole } from "../utils/auth";

const missingFieldsReducer = (data: any) => (acc: string[], curr: string) => {
  if (data[curr] === undefined) {
    return [...acc, curr];
  } else return acc;
};

const generateSchemaDocPath = (tablePath) => {
  const pathComponents = tablePath.split("/");
  return `_FIRETABLE_/settings/${
    pathComponents[1] === "table" ? "schema" : "groupSchema"
  }/${pathComponents[2]}`;
};
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

export const actionScript = functions.https.onCall(
  async (data: ActionData, context: functions.https.CallableContext) => {
    try {
      if (!context) {
        throw Error(`You are unauthenticated`);
      }

      const { ref, row, column, action } = data;

      const schemaDocPath = generateSchemaDocPath(ref.tablePath);
      const schemaDoc = await db.doc(schemaDocPath).get();
      const schemaDocData = schemaDoc.data();
      if (!schemaDocData) {
        return {
          success: false,
          message: "no schema found",
        };
      }
      const config = schemaDocData.columns[column.key].config;
      const { script, requiredRoles, requiredFields, undo, redo } = config;
      if (!hasAnyRole(requiredRoles, context)) {
        throw Error(`You don't have the required roles permissions`);
      }

      const missingRequiredFields = requiredFields
        ? requiredFields.reduce(missingFieldsReducer(row), [])
        : [];
      if (missingRequiredFields.length > 0) {
        throw new Error(
          `Missing required fields:${missingRequiredFields.join(", ")}`
        );
      }
      //
      // get auth
      console.log(
        JSON.stringify({
          undo,
          redo,
          row,
          ref,
          column,
          schemaDocData,
          script,
          requiredRoles,
          requiredFields,
        })
      );

      const result: {
        message: string;
        status: string;
        success: boolean;
      } = await eval(
        `async({row,db, ref,auth, utilFns})=>{${
          action === "undo" ? config["undo.script"] : script
        }}`
      )({ row, db, auth, utilFns, ref });
      if (result.success)
        return {
          success: result.success,
          message: result.message,
          cellValue: {
            redo: config["redo.enabled"],
            status: result.status,
            completedAt: serverTimestamp(),
            meta: { ranBy: context.auth!.token.email },
            undo: action !== "undo" && config["undo.enabled"],
          },
          undo: config["undo.enabled"],
          redo: config["redo.enabled"],
        };
      else
        return {
          success: false,
          message: result.message,
        };
    } catch (error) {
      return {
        success: false,
        error,
        message: error.message,
      };
    }
  }
);
