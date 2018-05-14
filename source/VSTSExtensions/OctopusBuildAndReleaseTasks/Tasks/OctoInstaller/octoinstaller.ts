import * as tasks from 'vsts-task-lib/task';
import * as tools from 'vsts-task-tool-lib/tool';
import { ToolRunner } from "vsts-task-lib/toolrunner";
import { RestClient } from "typed-rest-client/RestClient";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";

interface LatestResponse{
    "tag_name":string;
}

//https://download.octopusdeploy.com/octopus-tools/4.35.0/OctopusTools.4.35.0.portable.zip
//https://download.octopusdeploy.com/octopus-tools/4.35.0/OctopusTools.4.35.0.portable.tar.gz
const toolName = "Octo";

var github = new RestClient("OctoTFS/OctoInstaller",  "https://api.github.com");
const octoLatestReleaseUrl = "https://api.github.com/repos/OctopusDeploy/OctopusClients/releases/latest";

const downloadUrl = (version:string) => `https://download.octopusdeploy.com/octopus-tools/${version}/OctopusTools.${version}.portable.tar.gz`;

const resolveVersion = async (version: string) => {
    if(!version || version.toLowerCase() === "latest"){
        return github.get<LatestResponse>("repos/OctopusDeploy/OctopusClients/releases/latest").then(x => x.result.tag_name);
    }
    return Promise.resolve(version);
}

function getLocalTool(version:string): string {
    console.log("Checking local tool cache");
    return tools.findLocalTool(toolName, version);
}

async function run(){
    let version = await resolveVersion(tasks.getInput("version"));
    let toolPath =  await download(version);

    if(!process.env['PATH'].startsWith(path.dirname(toolPath))){
        tools.prependPath(path.dirname(toolPath));
    }
}

async function download(version: string): Promise<string>{
    var cachedToolPath = getLocalTool(version);

    if(!cachedToolPath){
        try{
            let downloadPath = await tools.downloadTool(downloadUrl(version));
            let unzippedPath = await tools.extractTar(downloadPath);
            cachedToolPath = await tools.cacheDir(unzippedPath, toolName, version);

        }catch(exception){
            throw new Error(`Failed to download octo tools from ${downloadUrl(version)}`)
        }
    }

    const octoPath = findOcto(cachedToolPath);
    if(!octoPath){
        throw new Error("Octo wasn't found in tools directory")
    }

    fs.chmod(octoPath, "777");
    return octoPath;
}

function findOcto(rootFolder){
    var octoPath = path.join(rootFolder, "*" + toolName + ".dll");
    console.log(`Looking for ${octoPath}`);
    var allPaths = tasks.find(rootFolder);
    var matches = tasks.match(allPaths, octoPath, rootFolder);
    console.log(matches);
    return matches[0];
}

function getExecutableExtention(): string {
    return os.type().match(/^Win/) ? ".exe" : "";
}

function getTempDirectory(): string {
    return tasks.getVariable('agent.tempDirectory') || os.tmpdir();
}

run().then(() => {
    tasks.setResult(tasks.TaskResult.Succeeded, "")
}, (reason) => {
    tasks.setResult(tasks.TaskResult.Failed, reason)
}).catch((error) => {
    tasks.setResult(tasks.TaskResult.Failed, error)
});