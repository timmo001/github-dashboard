import { ReactElement, useEffect, useMemo, useState } from "react";
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
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Icon } from "@mdi/react";
import {
  mdiAlertCircleOutline,
  mdiSourcePull,
  mdiChatOutline,
  mdiStarOutline,
  mdiEyeOutline,
  mdiSourceFork,
  mdiTagOutline,
  mdiTextBoxOutline,
} from "@mdi/js";
import moment from "moment";

import { Status, OAuth2 } from "@/types/general";
import { GitHub } from "@/lib/github";
import {
  IssueElement,
  RepositoryData,
  UserData,
  ViewerData,
} from "@/types/github";
import { useAuth } from "@/components/Context/Auth";
import { useRepository } from "@/components/Context/Repository";
import { useUser } from "@/components/Context/User";
import { useViewer } from "@/components/Context/Viewer";
import graphqlRepository from "@/lib/graphql/repository.graphql";
import graphqlUser from "@/lib/graphql/user.graphql";
import graphqlViewer from "@/lib/graphql/viewer.graphql";
import Layout from "@/components/Layout";
import Stat from "@/components/Stat";
import useStyles from "@/styles/jss/components/layout";

interface HomeProps {
  clientId: string;
}

const github = new GitHub();

export default function Home({ clientId }: HomeProps): ReactElement {
  const [alert, setAlert] = useState<string>();
  const [auth, setAuth] = useAuth();
  const [authorizeUrl, setAuthorizeUrl] = useState<string>();
  const [repositoryData, setRepositoryData] = useRepository();
  const [status, setStatus] = useState<Status>(Status.NotAuthorized);
  const [, setUserData] = useUser();
  const [, setViewerData] = useViewer();

  const router = useRouter();
  const { code, state } = router.query as NodeJS.Dict<string>;

  useEffect(() => {
    setAlert(undefined);
    setAuthorizeUrl(undefined);

    if (status !== Status.NotAuthorized) return;
    console.log("Authenticating...");

    let oAuthData: OAuth2 | null = null;
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
      setStatus(Status.Authenticated);
      return;
    }

    if (code && code.length > 0 && state && state.length > 0) {
      setStatus(Status.Authenticating);
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
        setStatus(Status.Authenticated);
      })();
      return;
    } else {
      const url = github.getAuthorizeUrl(clientId, window.location.origin);
      console.log("Generating authorize URL:", url);
      setAuthorizeUrl(url);
    }
  }, [status, clientId, code, router, setAuth, state]);

  useEffect(() => {
    console.log("Status:", status);
    if (status !== Status.Authenticated) return;
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
  }, [auth, status, setViewerData]);

  useEffect(() => {
    if (status !== Status.Authenticated) return;
    let type: string | null = null,
      owner: string | null = null,
      repository: string | null = null;
    const currentRepositoryStr =
      window.localStorage.getItem("currentRepository");
    if (!currentRepositoryStr) {
      setStatus(Status.NoRepository);
      return;
    }
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
  }, [status, setRepositoryData, setUserData]);

  const daysSince = useMemo<number>(() => {
    const firstDate = moment().subtract(1, "month").startOf("month").toDate();
    console.log("First date:", firstDate);

    const daysSince = moment().diff(firstDate, "days");
    console.log("Days since:", daysSince);

    return daysSince;
  }, []);

  const issuesByDay = useMemo<
    Array<{ date: string; Issues: number }> | undefined
  >(() => {
    if (!daysSince) return undefined;
    if (!repositoryData) return undefined;
    const issues = [];
    for (let i = daysSince; i >= 0; i--) {
      const date = moment().subtract(i, "days");
      const dayIssues = {
        date: date.format("Do MMM YYYY"),
        Issues: repositoryData.issues.items.filter((issue: IssueElement) =>
          issue.closed
            ? moment(issue.createdAt).isSameOrBefore(date) &&
              moment(issue.closedAt).isSameOrAfter(date)
            : moment(issue.createdAt).isBefore(date)
        ).length,
      };
      issues.push(dayIssues);
    }
    console.log("Issues:", issues);
    return issues;
  }, [daysSince, repositoryData]);

  const pullRequestsByDay = useMemo<
    Array<{ date: string; "Pull Requests": number }> | undefined
  >(() => {
    if (!daysSince) return undefined;
    if (!repositoryData) return undefined;
    const pullRequests = [];
    for (let i = daysSince; i >= 0; i--) {
      const date = moment().subtract(i, "days");
      const dayPullRequests = {
        date: date.format("Do MMM YYYY"),
        "Pull Requests": repositoryData.pullRequests.items.filter(
          (pullRequest: IssueElement) =>
            pullRequest.closed
              ? moment(pullRequest.createdAt).isSameOrBefore(date) &&
                moment(pullRequest.closedAt).isSameOrAfter(date)
              : moment(pullRequest.createdAt).isBefore(date)
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
        justifyContent="center"
      >
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
              }}
            >
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
          }}
        >
          {repositoryData ? (
            <>
              <Grid
                container
                direction="row"
                alignContent="space-around"
                justifyContent="space-around"
              >
                <Stat
                  icon={mdiChatOutline}
                  title="Discussions"
                  value={repositoryData.discussions?.total || 0}
                />
                <Stat
                  icon={mdiStarOutline}
                  title="Stargazers"
                  value={repositoryData.stargazers_count || 0}
                />
                <Stat
                  icon={mdiEyeOutline}
                  title="Watchers"
                  value={repositoryData.watchers?.totalCount || 0}
                />
                <Stat
                  icon={mdiSourceFork}
                  title="Forks"
                  value={repositoryData.forks_count || 0}
                />
                {repositoryData.release?.name ||
                repositoryData.refs?.tags[0]?.name ? (
                  <Stat
                    icon={mdiTagOutline}
                    title="Latest Release"
                    value={
                      repositoryData.release?.name ||
                      repositoryData.refs?.tags[0]?.name
                    }
                  />
                ) : (
                  ""
                )}
                {repositoryData.primaryLanguage?.name ? (
                  <Stat
                    icon={mdiTextBoxOutline}
                    title="Primary Language"
                    value={repositoryData.primaryLanguage?.name}
                  />
                ) : (
                  ""
                )}
              </Grid>

              <Grid
                container
                direction="row"
                alignContent="space-around"
                justifyContent="space-around"
                sx={{ margin: theme.spacing(2, 0) }}
              >
                <Grid item sm={12} lg={6} sx={{ padding: theme.spacing(1, 2) }}>
                  <Typography variant="h4" noWrap>
                    <Icon
                      path={mdiAlertCircleOutline}
                      size={1}
                      style={{ marginRight: theme.spacing(1) }}
                    />
                    Issues
                  </Typography>
                  <Typography variant="h5" noWrap>
                    {repositoryData.issuesOpen?.total || 0}
                  </Typography>
                  <div
                    style={{
                      width: "100%",
                      height: 520,
                    }}
                  >
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
                  <Typography variant="h4" noWrap>
                    <Icon
                      path={mdiSourcePull}
                      size={1}
                      style={{ marginRight: theme.spacing(1) }}
                    />
                    Open Pull Requests
                  </Typography>
                  <Typography variant="h5" noWrap>
                    {repositoryData.pullRequestsOpen?.total || 0}
                  </Typography>
                  <div
                    style={{
                      width: "100%",
                      height: 520,
                    }}
                  >
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
              justifyContent="space-around"
            >
              {status === Status.NoRepository ? (
                <Typography variant="h4" noWrap>
                  Please select a repository
                </Typography>
              ) : status !== Status.NotAuthorized ? (
                <CircularProgress color="primary" />
              ) : (
                ""
              )}
            </Grid>
          )}
        </Grid>
      </Grid>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      clientId: process.env.GITHUB_CLIENT_ID,
    },
    revalidate: 1,
  };
};
