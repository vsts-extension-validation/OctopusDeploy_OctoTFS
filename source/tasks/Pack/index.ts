import * as tasks from 'vsts-task-lib/task';
import * as fs from "fs";
import * as utils from "tasks/Utils";

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
        const nuGetReleaseNotesFile = tasks.getInput("NuGetReleaseNotesFile");
        const overwrite = tasks.getBoolInput("Overwrite");
        const include = utils.getLineSeparatedItems(tasks.getInput("Include"));
        const listFiles = tasks.getBoolInput("ListFiles");

        const octo = utils.getOctoCommandRunner("pack");

        octo.arg(`--id="${packageId}"`)
            .arg(`--format=${packageFormat}`)
            .arg(`--version=${packageVersion}`)
            .arg(`--outFolder="${outputPath}"`)
            .arg(`--basePath="${sourcePath}"`)
            .arg(`--author="${nuGetAuthor}"`)
            .arg(`--title="${nuGetTitle}"`)
            .arg(`--description="${nuGetDescription}"`)
            .arg(`--releaseNotes="${nuGetReleaseNotes}"`)
            .arg(`--overwrite=${overwrite}`)
            .argIf(listFiles, "--verbose");

        if(!utils.isNullOrWhitespace(nuGetReleaseNotesFile) && fs.existsSync(nuGetReleaseNotesFile)){
            console.log(`Release notes file: ${nuGetReleaseNotesFile}`);
            octo.arg(`--releaseNotesFile="${nuGetReleaseNotesFile}"`);
        }else{
            console.log("No release notes file found");
        }

        if(include){
            utils.multiArgument("include", include, octo);
        }

        const code: number = await octo.exec();
        tasks.setResult(tasks.TaskResult.Succeeded, "Succeeded with code " + code);
    }catch(err){
        tasks.error(err);
        tasks.setResult(tasks.TaskResult.Failed, "Failed to execute octo pack command. " + err.message);
    }
}

run();