import * as tasks from "azure-pipelines-task-lib/task";
import { getDefaultOctopusConnectionDetailsOrThrow } from "../../Utils/connection";
import { getLineSeparatedItems, getOverwriteModeFromReplaceInput, getRequiredInput } from "../../Utils/inputs";
import { Push } from "./push";

const space = getRequiredInput("Space");
const packages = getLineSeparatedItems(tasks.getInput("Package", true) || "");
const overwriteMode = getOverwriteModeFromReplaceInput(tasks.getInput("Replace", true) || "");
const additionalArguments = tasks.getInput("AdditionalArguments");

const connection = getDefaultOctopusConnectionDetailsOrThrow();

new Push(tasks.tool, connection).run(space, packages, overwriteMode, additionalArguments);
