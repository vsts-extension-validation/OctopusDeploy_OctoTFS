import * as tasks from "vsts-task-lib/task";
import { option } from "fp-ts";

export const DefaultOctoConnectionInputName = "OctoConnectedServiceName";

export function isNullOrWhitespace(value: string){
    return (!value || !/\S/.test(value));
}

export function safeTrim(value: string): string | null {
    return value ? value.trim() : value;
}

export function getLineSeparatedItems(value: string): Array<string>{
    return value ? value.split(/[\r\n]+/g) : [];
}

const getRequiredInput = (name: string) => {
    return option.fromNullable(tasks.getInput(name, true));
}

const splitComma = (x: string) => x.split(",").map(x => x.trim());

const getOptionalInput = (name: string) => {
    return option.fromNullable(tasks.getInput(name, false));
}

export const getOptionalCsvInput = (name: string) => {
    return getOptionalInput(name).map(splitComma).getOrElse([]);
}

export const getRequiredCsvInput = (name: string) => {
    return getRequiredInput(name).map(splitComma).getOrElse([]);
}

export { getRequiredInput, getOptionalInput }

export function getDefaultOctoConnectionInputValue() {
    return getRequiredInput(DefaultOctoConnectionInputName)
};
