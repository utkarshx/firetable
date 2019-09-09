import React from "react";
import { createStyles, Theme, makeStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import CssBaseline from "@material-ui/core/CssBaseline";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import Paper from "@material-ui/core/Paper";
import MenuIcon from "@material-ui/icons/Menu";
import Button from "@material-ui/core/Button";
import Skeleton from "@material-ui/lab/Skeleton";
import useSettings from "../hooks/useSettings";
import useTable from "../hooks/useTable";
import Table from "./Table";
import CreateTableDialog from "./CreateTableDialog";
import useTableConfig from "../hooks/useTableConfig";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    text: {
      padding: theme.spacing(2, 2, 0)
    },
    paper: {
      paddingBottom: 20,
      paddingTop: 5
    },

    subheader: {
      backgroundColor: theme.palette.background.paper
    },
    appBar: {
      top: "auto",
      bottom: 0
    },
    grow: {
      flexGrow: 1
    },
    fabButton: {
      position: "absolute",
      zIndex: 1,
      top: -30,
      right: 20,
      margin: "0 auto"
    },
    button: {
      color: "#fff",
      marginLeft: 8
    },
    skeleton: {
      marginLeft: 8,
      borderRadius: 5
    }
  })
);

export default function Navigation() {
  const classes = useStyles();
  const [settings, createTable] = useSettings();
  const tableConfig = useTableConfig("founders");
  const [table] = useTable({ path: "founders" });
  return (
    <React.Fragment>
      <CssBaseline />
      <Paper square className={classes.paper}>
        <Typography className={classes.text} variant="h5" gutterBottom>
          Founders
        </Typography>
      </Paper>
      <Table columns={tableConfig.columns} rows={table.rows} />
      <AppBar position="fixed" color="primary" className={classes.appBar}>
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="open drawer">
            <MenuIcon />
          </IconButton>
          {!settings.tables ? (
            <>
              <Skeleton
                variant="rect"
                width={120}
                height={40}
                className={classes.skeleton}
              />
              <Skeleton
                variant="rect"
                width={120}
                height={40}
                className={classes.skeleton}
              />
              <Skeleton
                variant="rect"
                width={120}
                height={40}
                className={classes.skeleton}
              />
              <Skeleton
                variant="rect"
                width={120}
                height={40}
                className={classes.skeleton}
              />
            </>
          ) : (
            <>
              {settings.tables.map(
                (table: { name: string; collection: string }) => (
                  <Button key={table.collection} className={classes.button}>
                    {table.name}
                  </Button>
                )
              )}
            </>
          )}

          <CreateTableDialog classes={classes} createTable={createTable} />
          <div className={classes.grow} />
        </Toolbar>
      </AppBar>
    </React.Fragment>
  );
}
