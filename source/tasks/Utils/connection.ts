import * as tasks from 'vsts-task-lib/task';

export interface OctoServerConnectionDetails {
    url: string;
    apiKey: string;
}

export function getOctopusConnectionDetails(): OctoServerConnectionDetails {
    const octoConnectedServiceName =  tasks.getInput("OctoConnectedServiceName", true);
    const octoEndpointAuthorization = tasks.getEndpointAuthorization(octoConnectedServiceName, false);
    return {
        url: tasks.getEndpointUrl(octoConnectedServiceName, false),
        apiKey: octoEndpointAuthorization.parameters["apitoken"]
    }
}