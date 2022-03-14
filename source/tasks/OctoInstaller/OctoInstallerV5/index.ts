import * as tasks from "azure-pipelines-task-lib/task";
import { Installer } from "./installer";

const version = tasks.getInput("version", true) || "";
new Installer("https://g.octopushq.com").run(version);
