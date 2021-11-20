'use strict';
import { ChildProcess } from "child_process";
import { EpinioExecutor } from "../executors/epinioExecutor";

export class Config {
    constructor(
        public readonly name: string,
        public readonly active: boolean,
        private readonly epinioExecutor: EpinioExecutor
    ) {
    }

    public setActive(): void {
        return this.epinioExecutor.setActiveConfig(this.name);
    }

    public delete(): void {
        return this.epinioExecutor.deleteConfig(this.name);
    }
}
