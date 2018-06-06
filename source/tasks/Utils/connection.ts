import * as tasks from 'vsts-task-lib/task';
import {RestClient} from "typed-rest-client/RestClient";
import { getDefaultOctoConnectionInputValue } from "./inputs";
import { either } from "fp-ts";
import OctoApiKeyHandler from "./OctoApiKeyHandler";

export interface OctoServerConnectionDetails {
    url: string;
    apiKey: string;
}

export function getDefaultOctopusConnectionDetailsOrThrow(){
    let result =  getDefaultOctoConnectionInputValue().map(getOctopusConnectionDetails).toNullable();
    if(!result){
        throw new Error("Could not retrieve default octo connection information");
    }
    return result;
}

export function getOctopusConnectionDetails(name: string): OctoServerConnectionDetails {
    const octoEndpointAuthorization = tasks.getEndpointAuthorization(name, false);
    return {
        url: tasks.getEndpointUrl(name, false),
        apiKey: octoEndpointAuthorization.parameters["apitoken"]
    }
}

export function fetchProjectName(details: OctoServerConnectionDetails, projectId: string){
    const client = new RestClient("OctoTFS", details.url, [new OctoApiKeyHandler(details.apiKey)]);
    return client.get<{Name: string}>(`api/projects/${projectId}`)
        .then(x => {
            if(x.result){
                return either.right<string, string>(x.result.Name);
            }

            return either.left<string,string>(`Could not resolve project name given id "{projectId}". Server returned status code: ${x.statusCode}`);
        }
    ).catch(error => either.left<string,string>(error))
}

export const isProjectId = (projectNameOrId: string) => /Projects-\d*/.test(projectNameOrId);

export function resolveProjectName(connection: OctoServerConnectionDetails, projectNameOrId: string){
    if(isProjectId(projectNameOrId)) {
        return fetchProjectName(connection, projectNameOrId);
    }

    return Promise.resolve(either.right<string, string>(projectNameOrId));
}
