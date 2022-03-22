import * as tasks from "azure-pipelines-task-lib/task";
import { getDefaultOctopusConnectionDetailsOrThrow } from "../../Utils/connection";
import { getLineSeparatedItems, getOverwriteModeFromReplaceInput, getRequiredInput } from "../../Utils/inputs";
import { Push } from "./push";
import { getOctopusCliTool } from "../../Utils/tool";

const space = getRequiredInput("Space");
const packages = getLineSeparatedItems(tasks.getInput("Package", true) || "");
const overwriteMode = getOverwriteModeFromReplaceInput(tasks.getInput("Replace", true) || "");
const additionalArguments = tasks.getInput("AdditionalArguments");

const connection = getDefaultOctopusConnectionDetailsOrThrow();

new Push(getOctopusCliTool(), connection).run(space, packages, overwriteMode, additionalArguments);
