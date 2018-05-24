import * as tasks from 'vsts-task-lib/task';
import {RestClient} from "typed-rest-client/RestClient";
import { getDefaultOctoConnectionInputValue } from "./inputs";
import { Either } from "monet";

export interface OctoServerConnectionDetails {
    url: string;
    apiKey: string;
}

export function getDefaultOctopusConnectionDetails(){
    return getOctopusConnectionDetails(getDefaultOctoConnectionInputValue().some());
}

export function getOctopusConnectionDetails(name: string): OctoServerConnectionDetails {
    const octoEndpointAuthorization = tasks.getEndpointAuthorization(name, false);
    return {
        url: tasks.getEndpointUrl(name, false),
        apiKey: octoEndpointAuthorization.parameters["apitoken"]
    }
}

export function fetchProjectName(details: OctoServerConnectionDetails, projectId: string){
    const client = new RestClient("OctoTFS",  details.url);
    return client.get<{name: string}>(`api/projects/${projectId}`)
        .then(x => {
            if(x.result){
                return Either.Right<string, string>(x.result.name);
            }

            return Either.Left<string,string>(`Could not resolve project name given id "{projectId}". Server returned status code: ${x.statusCode}`);
        }
    ).catch(error => Either.Left<string,string>(error))
}

export const isProjectId = (projectNameOrId: string) => /Project-\d*/.test(projectNameOrId);

export function resolveProjectName(connection: OctoServerConnectionDetails, projectNameOrId: string){
    if(isProjectId(projectNameOrId)) {
        return fetchProjectName(connection, projectNameOrId);
    }

    return Promise.resolve(Either.Right<string, string>(projectNameOrId));
}
