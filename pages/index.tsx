import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { GetStaticProps } from "next";
import { useRouter } from "next/router";
import {
  Alert,
  Button,
  CircularProgress,
  Grid,
  Typography,
  useTheme,
} from "@mui/material";
import { cyan, green } from "@mui/material/colors";
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import moment from "moment";

import { AuthenticationType, OAuth2 } from "lib/types/general";
import { GitHub } from "lib/github";
import {
  IssueElement,
  Repository,
  RepositoryData,
  User,
  UserData,
  ViewerData,
} from "lib/types/github";
import { useAuth } from "components/Context/Auth";
import { useRepository } from "components/Context/Repository";
import { useViewer } from "components/Context/Viewer";
import graphqlRepository from "lib/graphql/repository.graphql";
import graphqlUser from "lib/graphql/user.graphql";
import graphqlViewer from "lib/graphql/viewer.graphql";
import Layout from "components/Layout";
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
  const [repositoryData, setRepositoryData] = useRepository();
  const [userData, setUserData] = useState<User>();
  const [viewerData, setViewerData] = useViewer();

  const router = useRouter();
  const { code, state } = router.query as NodeJS.Dict<string>;

  useEffect(() => {
    // const missingParameters: Array<string> = [];
    // if (!owner || owner === "") missingParameters.push("Owner");
    // if (!repository || repository === "") missingParameters.push("Repository");
    // if (missingParameters.length > 0) {
    //   setAlert(
    //     `Missing required query parameter${
    //       missingParameters.length > 1 ? "s" : ""
    //     }: ${missingParameters.join(", ")}`
    //   );
    //   return;
    // }
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
    let type: string, owner: string, repository: string;
    const currentRepositoryStr =
      window.localStorage.getItem("currentRepository");
    if (!currentRepositoryStr) return;
    try {
      const currentRepository = JSON.parse(currentRepositoryStr);
      type = currentRepository.type;
      owner = currentRepository.owner;
      repository = currentRepository.repository;
    } catch (e) {
      console.error(e);
    }
    if (!type || !owner || !repository) return;
    github
      .graphQL<RepositoryData>(graphqlRepository, {
        owner,
        repository,
      })
      .then((data: RepositoryData) => {
        console.log("Repository Data:", data.repository);
        if (!data) {
          console.error("Could not fetch repository data.");
          setAlert("Could not fetch repository data.");
          return;
        }
        setRepositoryData(data.repository);
      });
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

  const daysSince = useMemo<number>(() => {
    const firstDate = moment().subtract(1, "month").startOf("month").toDate();
    console.log("First date:", firstDate);

    const daysSince = moment().diff(firstDate, "days");
    console.log("Days since:", daysSince);

    return daysSince;
  }, []);

  const issuesByDay = useMemo<Array<NodeJS.Dict<any>>>(() => {
    if (!daysSince) return undefined;
    if (!repositoryData) return undefined;
    const issues = [];
    for (let i = daysSince; i >= 0; i--) {
      const date = moment().subtract(i, "days").startOf("day");
      const dayIssues = {
        date: date.format("Do MMM YYYY"),
        Issues: repositoryData.issue.issues.filter((issue: IssueElement) =>
          issue.closed
            ? moment(issue.createdAt).startOf("day").isSameOrBefore(date) &&
              moment(issue.closedAt).startOf("day").isSameOrAfter(date)
            : moment(issue.createdAt).startOf("day").isBefore(date)
        ).length,
      };
      issues.push(dayIssues);
    }
    console.log("Issues:", issues);
    return issues;
  }, [daysSince, repositoryData]);

  const pullRequestsByDay = useMemo<Array<NodeJS.Dict<any>>>(() => {
    if (!daysSince) return undefined;
    if (!repositoryData) return undefined;
    const pullRequests = [];
    for (let i = daysSince; i >= 0; i--) {
      const date = moment().subtract(i, "days").startOf("day");
      const dayPullRequests = {
        date: date.format("Do MMM YYYY"),
        "Pull Requests": repositoryData.pull_request.pull_requests.filter(
          (pullRequest: IssueElement) =>
            pullRequest.closed
              ? moment(pullRequest.createdAt)
                  .startOf("day")
                  .isSameOrBefore(date) &&
                moment(pullRequest.closedAt).startOf("day").isSameOrAfter(date)
              : moment(pullRequest.createdAt).startOf("day").isBefore(date)
        ).length,
      };
      pullRequests.push(dayPullRequests);
    }
    console.log("Pull Requests:", pullRequests);
    return pullRequests;
  }, [daysSince, repositoryData]);

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
              sx={{ marginBottom: theme.spacing(2) }}
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
            padding: theme.spacing(1, 2, 1, 4),
          }}>
          {repositoryData ? (
            <>
              <Grid
                container
                direction="row"
                alignContent="space-around"
                justifyContent="space-around">
                <Grid item sx={{ padding: theme.spacing(1, 2) }}>
                  <Typography variant="h4" noWrap>
                    Discussions
                  </Typography>
                  <Typography variant="h5" noWrap>
                    {repositoryData.discussion?.total || 0}
                  </Typography>
                </Grid>
                <Grid item sx={{ padding: theme.spacing(1, 2) }}>
                  <Typography variant="h4" noWrap>
                    Open Issues
                  </Typography>
                  <Typography variant="h5" noWrap>
                    {repositoryData.issue?.total || 0}
                  </Typography>
                </Grid>
                <Grid item sx={{ padding: theme.spacing(1, 2) }}>
                  <Typography variant="h4" noWrap>
                    Open Pull Requests
                  </Typography>
                  <Typography variant="h5" noWrap>
                    {repositoryData.pull_request?.total || 0}
                  </Typography>
                </Grid>
                <Grid item sx={{ padding: theme.spacing(1, 2) }}>
                  <Typography variant="h4" noWrap>
                    Stargazers
                  </Typography>
                  <Typography variant="h5" noWrap>
                    {repositoryData.stargazers_count || 0}
                  </Typography>
                </Grid>
                <Grid item sx={{ padding: theme.spacing(1, 2) }}>
                  <Typography variant="h4" noWrap>
                    Watchers
                  </Typography>
                  <Typography variant="h5" noWrap>
                    {repositoryData.watchers?.totalCount || 0}
                  </Typography>
                </Grid>
                <Grid item sx={{ padding: theme.spacing(1, 2) }}>
                  <Typography variant="h4" noWrap>
                    Forks
                  </Typography>
                  <Typography variant="h5" noWrap>
                    {repositoryData.forks_count || 0}
                  </Typography>
                </Grid>
              </Grid>
              <Grid
                container
                direction="row"
                alignContent="space-around"
                justifyContent="space-around"
                sx={{ margin: theme.spacing(2, 0) }}>
                {repositoryData.release?.name ||
                repositoryData.refs?.tags[0]?.name ? (
                  <Grid item sx={{ padding: theme.spacing(1, 2) }}>
                    <Typography variant="h4" noWrap>
                      Latest Release
                    </Typography>
                    <Typography variant="h5" noWrap>
                      {repositoryData.release?.name ||
                        repositoryData.refs?.tags[0]?.name}
                    </Typography>
                  </Grid>
                ) : (
                  ""
                )}
                {repositoryData.primaryLanguage?.name ? (
                  <Grid item sx={{ padding: theme.spacing(1, 2) }}>
                    <Typography variant="h4" noWrap>
                      Primary Language
                    </Typography>
                    <Typography
                      variant="h5"
                      noWrap
                      color={repositoryData.primaryLanguage.color}>
                      {repositoryData.primaryLanguage?.name}
                    </Typography>
                  </Grid>
                ) : (
                  ""
                )}
              </Grid>

              <Grid
                container
                direction="row"
                alignContent="space-around"
                justifyContent="space-around"
                sx={{ margin: theme.spacing(2, 0) }}>
                <Grid item sm={12} lg={6} sx={{ padding: theme.spacing(1, 2) }}>
                  <Typography variant="h4" noWrap gutterBottom>
                    Open Issues by Day
                  </Typography>
                  <div
                    style={{
                      width: "100%",
                      height: 520,
                    }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={issuesByDay}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip
                          contentStyle={{
                            background: "#212121",
                            border: "none",
                          }}
                        />
                        <Line
                          type="linear"
                          dataKey="Issues"
                          stroke={green[500]}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Grid>
                <Grid item sm={12} lg={6} sx={{ padding: theme.spacing(1, 2) }}>
                  <Typography variant="h4" noWrap gutterBottom>
                    Open Pull Requests by Day
                  </Typography>
                  <div
                    style={{
                      width: "100%",
                      height: 520,
                    }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={pullRequestsByDay}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip
                          contentStyle={{
                            background: "#212121",
                            border: "none",
                          }}
                        />
                        <Line
                          type="linear"
                          dataKey="Pull Requests"
                          stroke={cyan[500]}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Grid>
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
