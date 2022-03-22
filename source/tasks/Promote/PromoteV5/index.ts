import * as tasks from "azure-pipelines-task-lib/task";
import { getDefaultOctopusConnectionDetailsOrThrow } from "../../Utils/connection";
import { getDelimitedInput, getRequiredInput } from "../../Utils/inputs";
import { Promote } from "./promote";
import { getOctopusCliTool } from "../../Utils/tool";

const space = getRequiredInput("Space");
const project = getRequiredInput("Project");
const from = getRequiredInput("From");
const to = getDelimitedInput("To");
const deployForTenants = getDelimitedInput("DeployForTenants");
const deployForTenantTags = getDelimitedInput("DeployForTenantTags");
const deploymentProgress = tasks.getBoolInput("ShowProgress");
const additionalArguments = tasks.getInput("AdditionalArguments");

const connection = getDefaultOctopusConnectionDetailsOrThrow();

new Promote(getOctopusCliTool(), connection).run(space, project, from, to, deployForTenants, deployForTenantTags, deploymentProgress, additionalArguments);
