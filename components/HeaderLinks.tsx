import React, { ReactElement, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { List, ListItem, Button } from "@mui/material";
import clsx from "clsx";

import { useViewer } from "./Context/Viewer";
import SetRepository from "./SetRepository";
import useStyles from "assets/jss/components/headerLinks";

function HeaderLinks(): ReactElement {
  const [setRepository, setSetRepository] = useState<boolean>(false);
  const [hoveringLoginButton, setHoveringLoginButton] =
    useState<boolean>(false);
  const [viewerData] = useViewer();

  const router = useRouter();
  const classes = useStyles();

  function handleSetRepository(): void {
    setSetRepository(true);
  }

  return (
    <>
      <List className={classes.list}>
        {viewerData ? (
          <ListItem className={classes.listItem}>
            <Button
              color={hoveringLoginButton ? "warning" : "primary"}
              variant="outlined"
              className={classes.navLink}
              onClick={() => {
                window.localStorage.removeItem("github-oauth-data");
                router.reload();
              }}
              onMouseEnter={() => {
                setHoveringLoginButton(true);
              }}
              onMouseLeave={() => {
                setHoveringLoginButton(false);
              }}
            >
              <span className={classes.listItemText}>
                {hoveringLoginButton
                  ? "Log out of GitHub"
                  : `Logged in as ${viewerData.login}`}
              </span>
            </Button>
          </ListItem>
        ) : (
          ""
        )}
        <ListItem className={clsx(classes.listItem, classes.divider)} />
        {viewerData ? (
          <ListItem className={classes.listItem}>
            <Button
              variant="outlined"
              className={classes.navLink}
              onClick={handleSetRepository}
            >
              <span className={classes.listItemText}>Set Repository</span>
            </Button>
          </ListItem>
        ) : (
          ""
        )}
        <ListItem className={clsx(classes.listItem, classes.divider)} />
        <ListItem className={classes.listItem}>
          <Link
            href={{
              pathname: "/",
              query: router.query,
            }}
          >
            <Button variant="text" className={classes.navLink}>
              <span className={classes.listItemText}>User</span>
            </Button>
          </Link>
        </ListItem>
        <ListItem className={classes.listItem}>
          <Link
            href={{
              pathname: "/repository",
              query: router.query,
            }}
          >
            <Button variant="text" className={classes.navLink}>
              <span className={classes.listItemText}>Repository</span>
            </Button>
          </Link>
        </ListItem>
      </List>
      {setRepository ? <SetRepository /> : ""}
    </>
  );
}

export default HeaderLinks;
