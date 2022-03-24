import React, { ReactElement, useEffect, useState } from "react";
import { GetStaticProps } from "next";
import { useRouter } from "next/router";
import { Alert, Button, CircularProgress, Grid, useTheme } from "@mui/material";
import { mdiAccountMultipleOutline, mdiSourceRepositoryMultiple } from "@mdi/js";

import { AuthenticationType, OAuth2 } from "lib/types/general";
import { GitHub } from "lib/github";
import { useAuth } from "components/Context/Auth";
import { UserData, ViewerData } from "lib/types/github";
import { useUser } from "components/Context/User";
import { useViewer } from "components/Context/Viewer";
import graphqlUser from "lib/graphql/user.graphql";
import graphqlViewer from "lib/graphql/viewer.graphql";
import Layout from "components/Layout";
import Stat from "components/Stat";
import useStyles from "assets/jss/components/layout";

interface DashboardProps {
  clientId: string;
}

const github = new GitHub();

function Dashboard({ clientId }: DashboardProps): ReactElement {
  const [auth, setAuth] = useAuth();
  const [alert, setAlert] = useState<string>();
  const [authenticated, setAuthenticated] = useState<AuthenticationType>(0);
  const [authorizeUrl, setAuthorizeUrl] = useState<string>();
  const [userData, setUserData] = useUser();
  const [, setViewerData] = useViewer();

  const router = useRouter();
  const { code, state } = router.query as NodeJS.Dict<string>;

  useEffect(() => {
    setAlert(undefined);
    setAuthorizeUrl(undefined);

    if (authenticated > AuthenticationType.NotAuthorized) return;
    console.log("Authenticating...");

    let oAuthData: OAuth2;
    try {
      const oauthDataStorage = window.localStorage.getItem("github-oauth-data");
      if (oauthDataStorage) oAuthData = JSON.parse(oauthDataStorage);
    } catch (e) {
      console.error("Error parsing OAuth data:", e);
    }

    if (oAuthData) {
      console.log("Using OAuth data:", oAuthData);
      setAuth(oAuthData);
      github.setAuth(oAuthData);
      if (oAuthData.expires_at && oAuthData.expires_at < Date.now()) {
        console.log("OAuth data expired, fetching new token...");
        (async () => {
          github.refreshToken(
            `${window.location.protocol}//${window.location.host}/api`,
            oAuthData.refresh_token
          );
        })();
      }
      setAuthenticated(AuthenticationType.Authenticated);
      return;
    }

    if (code?.length > 0 && state?.length > 0) {
      setAuthenticated(AuthenticationType.Authenticating);
      console.log("Using code and state:", code, state);
      (async () => {
        oAuthData = await github.authenticate(
          `${window.location.protocol}//${window.location.host}/api`,
          code,
          window.location.origin,
          state
        );
        console.log(oAuthData);
        if (!oAuthData) {
          console.error("Could not authenticate with GitHub.");
          setAlert("Could not authenticate with GitHub.");
          return;
        }
        if (oAuthData.error) {
          console.error("Could not authenticate with GitHub:", oAuthData);
          setAlert(`Could not authenticate with GitHub: ${oAuthData.error}`);
          return;
        }

        oAuthData.expires_at = Date.now() + oAuthData.expires_in * 1000;

        console.log("Set local storage:", oAuthData);
        window.localStorage.setItem(
          "github-oauth-data",
          JSON.stringify(oAuthData)
        );
        router.replace("/");

        setAuth(oAuthData);
        github.setAuth(oAuthData);
        setAuthenticated(AuthenticationType.Authenticated);
      })();
      return;
    } else {
      const url = github.getAuthorizeUrl(clientId, window.location.origin);
      console.log("Generating authorize URL:", url);
      setAuthorizeUrl(url);
    }
  }, [clientId, code, state]);

  useEffect(() => {
    console.log("Authenticated:", authenticated);
    if (authenticated !== AuthenticationType.Authenticated) return;
    (async () => {
      if (!github.auth)
        if (!auth) return;
        else github.setAuth(auth);
      const data = await github.graphQL<ViewerData>(graphqlViewer);
      console.log("Viewer Data:", data.viewer);
      if (!data) {
        console.error("Could not fetch user data.");
        setAlert("Could not fetch user data.");
        return;
      }
      setViewerData(data.viewer);
    })();
  }, [authenticated]);

  useEffect(() => {
    if (authenticated !== AuthenticationType.Authenticated) return;
    let type: string, owner: string;
    const currentRepositoryStr =
      window.localStorage.getItem("currentRepository");
    if (!currentRepositoryStr) return;
    try {
      const currentRepository = JSON.parse(currentRepositoryStr);
      type = currentRepository.type;
      owner = currentRepository.owner;
    } catch (e) {
      console.error(e);
    }
    if (!type || !owner) return;
    github
      .graphQL<UserData>(graphqlUser, {
        user: owner,
      })
      .then((data: UserData) => {
        console.log("User Data:", data.user);
        if (!data) {
          console.error("Could not fetch user data.");
          setAlert("Could not fetch user data.");
          return;
        }
        setUserData(data.user);
      });
  }, [authenticated]);

  const classes = useStyles();
  const theme = useTheme();
  return (
    <Layout classes={classes} title="Dashboard" description="GitHub Dashboard">
      <Grid
        className={classes.main}
        component="article"
        container
        direction="row"
        alignContent="space-around"
        justifyContent="center">
        {alert ? (
          <Grid item xs={11}>
            <Alert severity="error">{alert}</Alert>
          </Grid>
        ) : (
          ""
        )}
        {authorizeUrl ? (
          <Grid item xs={11}>
            <Button
              color="primary"
              variant="outlined"
              fullWidth
              sx={{ padding: theme.spacing(1), marginBottom: theme.spacing(2) }}
              onClick={() => {
                router.push(authorizeUrl);
              }}>
              Authenticate with GitHub
            </Button>
          </Grid>
        ) : (
          ""
        )}
        <Grid
          item
          xs={10}
          sx={{
            padding: theme.spacing(0),
            textAlign: "center",
          }}>
          {userData ? (
            <>
              <Grid
                container
                direction="row"
                alignContent="space-around"
                justifyContent="space-around">
                <Stat
                  icon={mdiSourceRepositoryMultiple}
                  title="Repositories"
                  value={userData.repositories?.totalCount || 0}
                />
                <Stat
                  icon={mdiAccountMultipleOutline}
                  title="Followers"
                  value={userData.followers?.totalCount || 0}
                />
                <Stat
                  icon={mdiAccountMultipleOutline}
                  title="Following"
                  value={userData.following?.totalCount || 0}
                />
              </Grid>
            </>
          ) : (
            <Grid
              container
              alignContent="space-around"
              justifyContent="space-around">
              <CircularProgress color="primary" />
            </Grid>
          )}
        </Grid>
      </Grid>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<DashboardProps> = async () => {
  return {
    props: {
      clientId: process.env.GITHUB_CLIENT_ID,
    },
    revalidate: 1,
  };
};

export default Dashboard;
