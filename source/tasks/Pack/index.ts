import * as tasks from 'vsts-task-lib/task';
import * as fs from "fs";
import * as utils from "../Utils";
import { configureTool, argument, argumentIfSet, flag, multiArgument } from '../Utils';

async function run() {
    try {
        const packageId = tasks.getInput("PackageId", true );
        const packageFormat = tasks.getInput("PackageFormat", true);
        const packageVersion = tasks.getInput("PackageVersion");
        const outputPath  = utils.safeTrim(tasks.getInput("OutputPath"));
        const sourcePath  = utils.safeTrim(tasks.getInput("SourcePath"));
        const nuGetAuthor = tasks.getInput("NuGetAuthor")
        const nuGetTitle = tasks.getInput("NuGetTitle");
        const nuGetDescription = tasks.getInput("NuGetDescription");
        const nuGetReleaseNotes = tasks.getInput("NuGetReleaseNotes");
        const nuGetReleaseNotesFile = tasks.getInput("NuGetReleaseNotesFile", false);
        const overwrite = tasks.getBoolInput("Overwrite");
        const include = utils.getLineSeparatedItems(tasks.getInput("Include"));
        const listFiles = tasks.getBoolInput("ListFiles");

        const octo = utils.getOctoCommandRunner("pack");

        const configure = configureTool([
            argument("id", packageId),
            argument("format", packageFormat),
            argument("version", packageVersion),
            argumentIfSet("outFolder", outputPath),
            argumentIfSet("basePath", sourcePath),
            argumentIfSet("author", nuGetAuthor),
            argumentIfSet("title", nuGetTitle),
            argumentIfSet("description",nuGetDescription),
            argumentIfSet("releaseNotes", nuGetReleaseNotes),
            argument("overwrite", overwrite.toString()),
            (tool) => {
                if(!utils.isNullOrWhitespace(nuGetReleaseNotesFile) && fs.existsSync(nuGetReleaseNotesFile) && fs.lstatSync(nuGetReleaseNotes).isFile()){
                    console.log(`Release notes file: ${nuGetReleaseNotesFile}`);
                    argument("releaseNotesFile", nuGetReleaseNotesFile, tool);
                }else{
                    console.log("No release notes file found");
                }
                return tool;
            },
            multiArgument("include", include),
            flag("verbose", listFiles)
        ]);

        const code: number = configure(octo).execSync().code;
        tasks.setResult(tasks.TaskResult.Succeeded, "Pack succeeded with code " + code);
    }catch(err){
        tasks.error(err);
        tasks.setResult(tasks.TaskResult.Failed, "Failed to execute octo pack command. " + err.message);
    }
}

run();