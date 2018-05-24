import * as tasks from 'vsts-task-lib/task';
import * as utils from "tasks/Utils";
import { argument, multiArgument, connectionArguments, includeArguments, configureTool, flag } from 'tasks/Utils/tool';

async function run() {
    try {
        const connection = utils.getDefaultOctopusConnectionDetails();

        const project = tasks.getInput("Project", true );
        const releaseNumber = tasks.getInput("ReleaseNumber", true);
        const environments = utils.getRequiredCsvInput("Environments");
        const showProgress = tasks.getBoolInput("ShowProgress");
        const deploymentForTenants = utils.getOptionalCsvInput("DeployForTenants");
        const deployForTenantTags = utils.getOptionalCsvInput("DeplyForTentantTags");
        const additionalArguments = tasks.getInput("AdditionalArguments");
        let projectName = project;

        if(/Project-\d*/.test(project)){
            console.info("Project Id passed, getting project name");
            const result = await utils.getProjectNameFromId(connection, project);

            if(result.isRight){
                projectName = result.right();
            }else{
                console.warn(result.left());
            }
        }

        const octo = utils.getOctoCommandRunner("deploy-release");

        const configure = configureTool([
            argument("project", projectName),
            argument("releaseNumber", releaseNumber),
            connectionArguments(connection),
            multiArgument("deployTo", environments),
            multiArgument("tenant", deploymentForTenants),
            multiArgument("tenanttag", deployForTenantTags),
            flag("progress", showProgress),
            includeArguments(additionalArguments)
        ]);

        const code:number = await configure(octo).exec();

        tasks.setResult(tasks.TaskResult.Succeeded, "Succeeded with code " + code);
    }catch(err){
        tasks.error(err);
        tasks.setResult(tasks.TaskResult.Failed, "Failed to execute octo pack command. " + err.message);
    }
}

run();