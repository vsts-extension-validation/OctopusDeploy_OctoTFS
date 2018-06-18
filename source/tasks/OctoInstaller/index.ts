import * as path from "path";
import * as fs from "fs";
import * as tasks from 'vsts-task-lib/task';
import * as tools from 'vsts-task-tool-lib/tool';
import * as TypedRestClient from "typed-rest-client/RestClient";
import { ToolName } from "../Utils";

interface LatestResponse {
    "tag_name":string;
}
const RestClient = TypedRestClient.RestClient;

var github = new RestClient("OctoTFS/OctoInstaller",  "https://api.github.com");

const resolveDownloadUrl = (version:string) => {
    return `https://download.octopusdeploy.com/octopus-tools/${version}/OctopusTools.${version}.portable.zip`
};

const extract = (archivePath: string) => {
    return tools.extractZip(archivePath);
}

function getExecutableExtention(): string {
    return ".dll";
}

const resolveVersion = async (version: string) => {
    if(!version || version.toLowerCase() === "latest"){
        return github.get<LatestResponse>("repos/OctopusDeploy/OctopusClients/releases/latest").then(x => x.result ? x.result.tag_name : "");
    }
    return Promise.resolve(version);
}

function getLocalTool(version:string): string {
    console.log("Checking local tool cache");
    return tools.findLocalTool(ToolName, version);
}

function findOcto(rootFolder: string){
    var octoPath = path.join(rootFolder, "*" + ToolName + getExecutableExtention());
    console.log(`Looking for ${octoPath}`);
    var allPaths = tasks.find(rootFolder);
    var matches = tasks.match(allPaths, octoPath, rootFolder);
    return matches[0];
}

async function run(){
    let version = await resolveVersion(tasks.getInput("version"));
    console.log(`Using octo version ${version}`);
    let toolPath =  await download(version);

    if(!process.env['PATH'].startsWith(path.dirname(toolPath))){
        tools.debug(`Adding ${ToolName} to path`);
        tools.prependPath(path.dirname(toolPath));
    }
}

async function download(version: string): Promise<string>{
    var cachedToolPath = getLocalTool(version);

    if(!cachedToolPath){
        try{
            let downloadPath = await tools.downloadTool(resolveDownloadUrl(version));
            let toolPath = await extract(downloadPath);

            tools.debug(`Adding ${ToolName} ${version} to cache`);
            tasks.writeFile(path.join(toolPath, `${ToolName}.cmd`), `dotnet "%~dp0/${ToolName}.dll" %*`);
            cachedToolPath = await tools.cacheDir(toolPath, ToolName, version);

        }catch(exception){
            throw new Error(`Failed to download octo tools from ${resolveDownloadUrl(version)}. ${exception}`)
        }
    }

    const octoPath = findOcto(cachedToolPath);
    if(!octoPath){
        throw new Error("Octo wasn't found in tools directory")
    }

    tools.debug(`Found ${ToolName} at ${octoPath}`)

    fs.chmod(octoPath, "777");
    return octoPath;
}

run().then(() => {
    tasks.setResult(tasks.TaskResult.Succeeded, "")
}, (reason) => {
    tasks.setResult(tasks.TaskResult.Failed, reason)
}).catch((error) => {
    tasks.setResult(tasks.TaskResult.Failed, error)
});