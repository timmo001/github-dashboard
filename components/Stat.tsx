import React, { ReactElement } from "react";
import { Grid, Typography, useTheme } from "@mui/material";
import { Icon } from "@mdi/react";

interface StatProps {
  icon: string;
  title: string;
  value: number | string;
}

function Stat({ icon, title, value }: StatProps): ReactElement {
  const theme = useTheme();

  return (
    <>
      <Grid item sx={{ padding: theme.spacing(1, 2) }}>
        <Typography variant="h4" noWrap>
          <Icon
            path={icon}
            size={1}
            style={{ marginRight: theme.spacing(1) }}
          />
          {title}
        </Typography>
        <Typography variant="h5" noWrap>
          {value}
        </Typography>
      </Grid>
    </>
  );
}

export default Stat;
