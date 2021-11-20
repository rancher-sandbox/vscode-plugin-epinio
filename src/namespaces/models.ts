'use strict';
import { ChildProcess } from "child_process";
import { Application } from "../applications/models";
import { EpinioExecutor } from "../executors/epinioExecutor";
import { parseTableLines } from "../utils/epinioOutputParser";

export class Namespace {

    private _applications: Application[] | [];

    constructor(
        public readonly name: string,
        private readonly epinioExecutor: EpinioExecutor
    ) {
        this._applications = [];
    }

    public getApplications(force: boolean = false): Application[] {
        if (this._applications === undefined || this._applications.length === 0 || force) {
            this.refreshApplications();
        }
        return this._applications || [];
    }

    public refreshApplications(): void {
        this._applications = this._getApplications();
    }

    private _getApplications(): Application[] {
        this.epinioExecutor.setNamespace(this.name);
        const appList = this.epinioExecutor.getAppListByNamespace(this.name);
        const namespace = this;
        const executor = this.epinioExecutor;
        return appList.map(item => new Application(namespace, item?.name.trim(), executor));
    }

    public delete(): ChildProcess {
        return this.epinioExecutor.deleteNamespace(this.name);
    }

}
