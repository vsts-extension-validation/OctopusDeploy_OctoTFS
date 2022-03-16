import * as tasks from "azure-pipelines-task-lib/task";
import { getDefaultOctopusConnectionDetailsOrThrow } from "../../Utils/connection";
import { getRequiredInput } from "../../Utils/inputs";
import { OctoCli } from "./octoCli";

const command = getRequiredInput("command");
const args = tasks.getInput("args");

const connection = getDefaultOctopusConnectionDetailsOrThrow();

new OctoCli(tasks.tool, command, connection).run(args);
