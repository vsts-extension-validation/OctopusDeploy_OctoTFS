import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
    maxWorkers: 4,
    verbose: true,
    preset: "ts-jest/presets/js-with-ts",
};

export default config;
