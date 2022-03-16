import * as tasks from "azure-pipelines-task-lib/task";
import { getDelimitedInput, getRequiredInput } from "../../Utils/inputs";
import { CreateRelease } from "./createRelease";
import { getDefaultOctopusConnectionDetailsOrThrow } from "../../Utils/connection";

const space = getRequiredInput("Space");
const project = getRequiredInput("ProjectName");
const releaseNumber = tasks.getInput("ReleaseNumber");
const channel = tasks.getInput("Channel");
const customReleaseNotes = tasks.getInput("CustomReleaseNotes");
const deployToEnvironments = getDelimitedInput("DeployToEnvironment");
const deployForTenants = getDelimitedInput("DeployForTenants");
const deployForTenantTags = getDelimitedInput("DeployForTenantTags");
const deploymentProgress = tasks.getBoolInput("DeploymentProgress");
const additionalArguments = tasks.getInput("AdditionalArguments");
const gitRef = tasks.getInput("GitRef");
const gitCommit = tasks.getInput("GitCommit");

const connection = getDefaultOctopusConnectionDetailsOrThrow();

new CreateRelease(tasks.tool, connection).run(space, project, releaseNumber, channel, customReleaseNotes, deployToEnvironments, deployForTenants, deployForTenantTags, deploymentProgress, additionalArguments, gitRef, gitCommit);
