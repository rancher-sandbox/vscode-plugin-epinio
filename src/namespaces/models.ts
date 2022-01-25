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

    public async getApplications(force: boolean = false): Promise<Application[]> {
        if (this._applications === undefined || this._applications.length === 0 || force) {
            await this.refreshApplications();
        }
        return this._applications || [];
    }

    public async refreshApplications() {
        this.epinioExecutor.setNamespace(this.name);
        const namespace = this;
        const executor = this.epinioExecutor;
        await this.epinioExecutor._getAppListByNamespace(this.name).then(res => {
            this._applications = res.data.map(item => new Application(namespace, item?.meta.name, executor));
        });
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

    public async create(): Promise<any> {
        const ret =  await this.epinioExecutor._createNamespace(this.name);
        return ret;
    }

}
