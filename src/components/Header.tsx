import React, { ReactElement, useEffect, useState } from "react";
import {
  AppBar,
  Drawer,
  Hidden,
  IconButton,
  PropTypes,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import { mdiMenu } from "@mdi/js";
import { Icon } from "@mdi/react";
import clsx from "clsx";

import { useRepository } from "./Context/Repository";
import useStyles from "@/styles/jss/components/header";

type ColorExpanded = PropTypes.Color | "transparent";

interface HeaderProps {
  absolute?: string;
  brand?: string;
  color?: ColorExpanded;
  fixed?: boolean;
  rightLinks?: ReactElement;
}

function Header(props: HeaderProps): ReactElement {
  const classes = useStyles();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [repositoryData] = useRepository();

  function handleDrawerToggle(): void {
    setMobileOpen(!mobileOpen);
  }

  const { color, rightLinks, brand, fixed, absolute } = props;

  const theme = useTheme();
  return (
    <AppBar
      className={clsx({
        [classes.appBar]: true,
        [classes.absolute]: absolute,
        [classes.fixed]: fixed,
      })}
      color={color}
    >
      <Toolbar className={classes.container}>
        <Typography className={classes.title} component="div" variant="h4">
          {brand}
          {repositoryData ? (
            <Typography
              component="span"
              variant="h6"
              sx={{
                position: "absolute",
                top: "calc(50% - 0.98rem)",
                marginLeft: theme.spacing(4),
              }}
            >
              <a
                href={repositoryData.owner.url}
                rel="noreferrer"
                target="_blank"
                style={{ color: theme.palette.text.primary }}
              >
                {repositoryData?.owner?.login}
              </a>
              /
              <a
                href={repositoryData.url}
                rel="noreferrer"
                target="_blank"
                style={{ color: theme.palette.text.primary }}
              >
                {repositoryData?.name}
              </a>
            </Typography>
          ) : (
            ""
          )}
        </Typography>
        <Hidden xlDown implementation="css">
          {rightLinks}
        </Hidden>
        <Hidden mdUp>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            size="large"
            onClick={handleDrawerToggle}
          >
            <Icon path={mdiMenu} size={1} />
          </IconButton>
        </Hidden>
      </Toolbar>
      <Hidden mdUp implementation="css">
        <Drawer
          variant="temporary"
          anchor={"right"}
          open={mobileOpen}
          classes={{
            paper: classes.drawerPaper,
          }}
          onClose={handleDrawerToggle}
        >
          <div className={classes.appResponsive}>{rightLinks}</div>
        </Drawer>
      </Hidden>
    </AppBar>
  );
}

export default Header;
