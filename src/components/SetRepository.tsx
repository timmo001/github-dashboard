import {
  ChangeEvent,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/router";
import {
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
} from "@mui/lab";

import { CurrentRepository, CurrentRepositoryType } from "@/types/general";
import { GitHub } from "@/lib/github";
import {
  Organization,
  OrganizationData,
  RepositoryNode,
  User,
  UserData,
} from "@/types/github";
import { useAuth } from "./Context/Auth";
import { useViewer } from "./Context/Viewer";
import graphqlOrganization from "@/lib/graphql/organization.graphql";
import graphqlUser from "@/lib/graphql/user.graphql";

interface Step {
  label: string;
  value: string;
}

const steps: Array<Step> = [
  { label: "Type", value: "type" },
  { label: "Owner", value: "owner" },
  { label: "Repository", value: "repository" },
];

const github = new GitHub();

function SetRepository(): ReactElement {
  const [auth] = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>(steps[0]);
  const [newRepository, setNewRepository] = useState<CurrentRepository>();
  const [ownerData, setOwnerData] = useState<Organization | User>();
  const [viewerData] = useViewer();

  const router = useRouter();

  useEffect(() => {
    const currentRepositoryStr =
      window.localStorage.getItem("currentRepository");
    let currentRepository: CurrentRepository | null = null;
    if (currentRepositoryStr) {
      try {
        currentRepository = JSON.parse(currentRepositoryStr);
      } catch (e) {
        console.error(e);
      }
    }
    setNewRepository({
      type: currentRepository?.type || CurrentRepositoryType.User,
      owner: currentRepository?.owner || viewerData?.login || "",
      repository: currentRepository?.repository || "",
    });
  }, [viewerData?.login]);

  const getRepositories = useCallback(() => {
    if (!newRepository) return;
    const { type, owner } = newRepository;
    if (!auth || !type || !owner) return;
    github.setAuth(auth);

    console.log({ type, owner });
    setOwnerData(undefined);

    if (type === CurrentRepositoryType.Organization) {
      github
        .graphQL<OrganizationData>(graphqlOrganization, {
          organization: owner,
        })
        .then(({ organization }) => {
          setOwnerData(organization);
        });
    } else if (type === CurrentRepositoryType.User) {
      github
        .graphQL<UserData>(graphqlUser, {
          user: owner,
        })
        .then(({ user }) => {
          setOwnerData(user);
        });
    }
  }, [auth, newRepository]);

  const currentStepIndex = useMemo<number>(
    () => steps.findIndex((step: Step) => step.value === currentStep.value),
    [currentStep]
  );

  const repositoriesPicker = useMemo<Array<string> | undefined>(() => {
    if (!ownerData) return undefined;
    return ownerData.repositories.nodes.map(
      (repository: RepositoryNode) => repository.name
    );
  }, [ownerData]);

  function handleCloseSetRepository(): void {
    setTimeout(() => router.reload(), 500);
  }

  function handleConfirmSetRepository(): void {
    if (!newRepository) return;
    window.localStorage.setItem(
      "currentRepository",
      JSON.stringify(newRepository)
    );
    handleCloseSetRepository();
  }

  function handleGoToPreviousStep(): void {
    setCurrentStep(steps[currentStepIndex - 1]);
  }

  function handleGoToNextStep(): void {
    if (newRepository && currentStep.label === "Owner") {
      setNewRepository({ ...newRepository, repository: "" });
      getRepositories();
    }
    setCurrentStep(steps[currentStepIndex + 1]);
  }

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Dialog
      fullScreen={fullScreen}
      fullWidth
      maxWidth="md"
      open
      scroll="body"
      onClose={handleCloseSetRepository}>
      <DialogTitle>Change Repository</DialogTitle>
      {newRepository ? (
        <>
          <DialogContent>
            <Grid container direction="row">
              <Grid
                item
                xs={5}
                container
                alignContent="center"
                justifyContent="flex-end">
                <Timeline position="alternate">
                  {steps.map((step: Step, key: number) => (
                    <TimelineItem key={key}>
                      <TimelineSeparator>
                        <TimelineDot
                          color={
                            currentStep.value === step.value
                              ? "primary"
                              : "grey"
                          }
                        />
                        {key < steps.length - 1 ? <TimelineConnector /> : ""}
                      </TimelineSeparator>
                      <TimelineContent>{step.label}</TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </Grid>
              <Grid
                item
                xs
                container
                alignContent="center"
                justifyContent="center">
                {currentStep.label === "Type" ? (
                  <Autocomplete
                    disableClearable
                    fullWidth
                    options={[
                      CurrentRepositoryType.Organization,
                      CurrentRepositoryType.User,
                    ]}
                    value={newRepository.type}
                    onChange={(_event, newValue: string) => {
                      setNewRepository({
                        ...newRepository,
                        [currentStep.value]: newValue,
                      });
                    }}
                    renderInput={(params): JSX.Element => (
                      <TextField {...params} label={currentStep.label} />
                    )}
                  />
                ) : currentStep.label === "Owner" ? (
                  <TextField
                    fullWidth
                    margin="dense"
                    label={currentStep.label}
                    value={newRepository.owner}
                    onChange={(event: ChangeEvent<HTMLInputElement>): void => {
                      setNewRepository({
                        ...newRepository,
                        [currentStep.value]: event.target.value,
                      });
                    }}
                  />
                ) : currentStep.label === "Repository" && repositoriesPicker ? (
                  <Autocomplete
                    disableClearable
                    fullWidth
                    options={repositoriesPicker}
                    value={newRepository.repository}
                    onChange={(_event, newValue: string) => {
                      setNewRepository({
                        ...newRepository,
                        [currentStep.value]: newValue,
                      });
                    }}
                    renderInput={(params): JSX.Element => (
                      <TextField {...params} label={currentStep.label} />
                    )}
                  />
                ) : (
                  <CircularProgress color="primary" />
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSetRepository}>Cancel</Button>
            {currentStepIndex === steps.length - 1 ? (
              <>
                <Button onClick={handleGoToPreviousStep}>Previous</Button>
                <Button onClick={handleConfirmSetRepository}>Confirm</Button>
              </>
            ) : (
              <>
                {currentStepIndex > 0 ? (
                  <Button onClick={handleGoToPreviousStep}>Previous</Button>
                ) : (
                  ""
                )}
                <Button onClick={handleGoToNextStep}>Next</Button>
              </>
            )}
          </DialogActions>
        </>
      ) : (
        <Grid
          container
          alignContent="space-around"
          justifyContent="space-around">
          <CircularProgress color="primary" />
        </Grid>
      )}
    </Dialog>
  );
}

export default SetRepository;
