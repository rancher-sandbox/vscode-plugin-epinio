'use strict';
import { ChildProcess } from "child_process";
import { Application } from "../applications/models";
import { EpinioExecutor } from "../executors/epinioExecutor";

export class Service {

    constructor(
        public application: Application,
        public readonly name: string,
        private executor: EpinioExecutor
    ) {
    }

    public bind(): ChildProcess {
        return this.executor.bind(this.name);
    }

    public unbind(): ChildProcess {
        return this.executor.unbind(this.name);
    }

    public delete(): string {
        return this.executor.deleteService(this.name);
    }

}
