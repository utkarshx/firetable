import React, { useState, lazy, Suspense } from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import Grid from "@material-ui/core/Grid";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import {
  Typography,
  IconButton,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import { FieldType } from "constants/fields";
import OptionsInput from "./ConfigFields/OptionsInput";
import { useFiretableContext } from "contexts/firetableContext";
import MultiSelect from "@antlerengineering/multiselect";
import _sortBy from "lodash/sortBy";
import FieldsDropdown from "../FieldsDropdown";
import ColumnSelector from "./ConfigFields/ColumnSelector";
import FieldSkeleton from "components/SideDrawer/Form/FieldSkeleton";
import RoleSelector from "components/RolesSelector";
const CodeEditor = lazy(
  () => import("../../editors/CodeEditor" /* webpackChunkName: "CodeEditor" */)
);
const ConfigFields = ({ fieldType, config, handleChange, tables, columns }) => {
  switch (fieldType) {
    case FieldType.singleSelect:
    case FieldType.multiSelect:
      return (
        <>
          <OptionsInput
            options={config.options ?? []}
            handleChange={handleChange("options")}
          />
          <Typography variant="overline">ADD NEW?</Typography>
          <Grid container direction="row" justify="space-between">
            <Typography variant="subtitle1">
              User can add new options.
            </Typography>
            <Switch
              checked={config.freeText}
              onClick={() => {
                handleChange("freeText")(!config.freeText);
              }}
            />
          </Grid>
        </>
      );
    case FieldType.connectTable:
      const tableOptions = _sortBy(
        tables?.map((t) => ({
          label: `${t.section} - ${t.name}`,
          value: t.collection,
        })) ?? [],
        "label"
      );

      return (
        <>
          <MultiSelect
            options={tableOptions}
            freeText={false}
            value={config.index}
            onChange={handleChange("index")}
            multiple={false}
          />
          <ColumnSelector
            label={"Primary Keys"}
            value={config.primaryKeys}
            table={config.index}
            handleChange={handleChange("primaryKeys")}
            validTypes={[FieldType.shortText, FieldType.singleSelect]}
          />
          <TextField
            label="filter template"
            name="filters"
            fullWidth
            onChange={(e) => {
              handleChange("filters")(e.target.value);
            }}
          />
        </>
      );
    case FieldType.subTable:
      return (
        <ColumnSelector
          label={"Parent Label"}
          value={config.parentLabel}
          tableColumns={
            columns
              ? Array.isArray(columns)
                ? columns
                : Object.values(columns)
              : []
          }
          handleChange={handleChange("parentLabel")}
          validTypes={[FieldType.shortText, FieldType.singleSelect]}
        />
      );

    case FieldType.action:
      return (
        <>
          <Typography variant="overline">Allowed roles</Typography>
          <Typography variant="body2">
            Authenticated user must have at least one of these to run the script
          </Typography>
          <RoleSelector
            label={"Allowed Roles"}
            value={config.requiredRoles}
            handleChange={handleChange("requiredRoles")}
          />

          <Typography variant="overline">Required fields</Typography>
          <Typography variant="body2">
            All of the selected fields must have a value for the script to run
          </Typography>
          <ColumnSelector
            label={"Required fields"}
            value={config.requiredFields}
            tableColumns={
              columns
                ? Array.isArray(columns)
                  ? columns
                  : Object.values(columns)
                : []
            }
            handleChange={handleChange("requiredFields")}
          />
          <Divider />
          <Typography variant="overline">Confirmation Template</Typography>
          <Typography variant="body2">
            The action button will not ask for confirmation if this is left
            empty
          </Typography>

          <TextField
            label="Confirmation Template"
            placeholder="Are sure you want to invest {{stockName}}?"
            value={config.confirmation}
            onChange={(e) => {
              handleChange("confirmation")(e.target.value);
            }}
            fullWidth
          />
          <FormControlLabel
            control={
              <Switch
                checked={config.isActionScript}
                onChange={() =>
                  handleChange("isActionScript")(
                    !Boolean(config.isActionScript)
                  )
                }
                name="actionScript"
              />
            }
            label="Set as an action script"
          />
          {!Boolean(config.isActionScript) ? (
            <TextField
              label="callable name"
              name="callableName"
              fullWidth
              onChange={(e) => {
                handleChange("callableName")(e.target.value);
              }}
            />
          ) : (
            <>
              <Typography variant="overline">action script</Typography>
              <Suspense fallback={<FieldSkeleton height={180} />}>
                <CodeEditor
                  height={180}
                  script={config.script}
                  handleChange={handleChange("script")}
                />
              </Suspense>
              <FormControlLabel
                control={
                  <Switch
                    checked={config["redo.enabled"]}
                    onChange={() =>
                      handleChange("redo.enabled")(
                        !Boolean(config["redo.enabled"])
                      )
                    }
                    name="redo toggle"
                  />
                }
                label="enable redo(reruns the same script)"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={config["undo.enabled"]}
                    onChange={() =>
                      handleChange("undo.enabled")(
                        !Boolean(config["undo.enabled"])
                      )
                    }
                    name="undo toggle"
                  />
                }
                label="enable undo"
              />
              {config["undo.enabled"] && (
                <>
                  <Typography variant="overline">
                    Undo Confirmation Template
                  </Typography>
                  <TextField
                    label="template"
                    placeholder="are you sure you want to sell your stocks in {{stockName}}"
                    value={config["undo.confirmation"]}
                    onChange={(e) => {
                      handleChange("undo.confirmation")(e.target.value);
                    }}
                    fullWidth
                  />
                  <Typography variant="overline">Undo Action script</Typography>
                  <Suspense fallback={<FieldSkeleton height={180} />}>
                    <CodeEditor
                      height={180}
                      script={config["undo.script"]}
                      handleChange={handleChange("undo.script")}
                    />
                  </Suspense>
                </>
              )}
            </>
          )}
        </>
      );
    case FieldType.derivative:
      return (
        <>
          <ColumnSelector
            label={
              "Listener fields (this script runs when these fields change)"
            }
            value={config.listenerFields}
            tableColumns={
              columns
                ? Array.isArray(columns)
                  ? columns
                  : Object.values(columns)
                : []
            }
            handleChange={handleChange("listenerFields")}
          />

          <Typography variant="overline">derivative script</Typography>
          <Suspense fallback={<FieldSkeleton height={200} />}>
            <CodeEditor
              script={config.script}
              handleChange={handleChange("script")}
            />
          </Suspense>

          <Typography variant="overline">Field type of the output</Typography>
          <FieldsDropdown
            value={config.renderFieldType}
            onChange={(newType: any) => {
              handleChange("renderFieldType")(newType.target.value);
            }}
          />
          {config.renderFieldType && (
            <>
              <Typography variant="overline"> Rendered field config</Typography>
              <ConfigFields
                fieldType={config.renderFieldType}
                config={config}
                handleChange={handleChange}
                tables={tables}
                columns={columns}
              />
            </>
          )}
        </>
      );
    default:
      return <></>;
  }
};
const ConfigForm = ({ type, config, handleChange }) => {
  const { tableState, tables } = useFiretableContext();

  if (!tableState) return <></>;
  const { columns } = tableState;

  return (
    <ConfigFields
      fieldType={type}
      columns={columns}
      config={config}
      handleChange={handleChange}
      tables={tables}
    />
  );
};

export default function FormDialog({
  name,
  fieldName,
  type,
  open,
  config,
  handleClose,
  handleSave,
}: {
  name: string;
  fieldName: string;
  type: FieldType;
  open: boolean;
  config: any;
  handleClose: Function;
  handleSave: Function;
}) {
  const [newConfig, setNewConfig] = useState(config ?? {});

  return (
    <div>
      <Dialog
        maxWidth="xl"
        open={open}
        onClose={(e, r) => {
          handleClose();
        }}
        aria-labelledby="form-column-settings"
      >
        <DialogContent>
          <Grid
            style={{ minWidth: 450 }}
            container
            justify="space-between"
            alignContent="flex-start"
            direction="row"
          >
            <Typography variant="h6">{name}: Settings</Typography>
            <IconButton
              onClick={() => {
                handleClose();
              }}
            >
              <CloseIcon />
            </IconButton>
          </Grid>
          <Typography variant="overline"></Typography>

          {
            <ConfigForm
              type={type}
              handleChange={(key) => (update) => {
                setNewConfig({ ...newConfig, [key]: update });
              }}
              config={newConfig}
            />
          }
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              handleClose();
            }}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              handleSave(fieldName, { config: newConfig });
            }}
            color="primary"
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
