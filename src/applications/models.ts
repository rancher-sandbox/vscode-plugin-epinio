'use strict';
import { ChildProcess } from "child_process";
import { Service } from "../services/models";
import { EpinioExecutor } from "../executors/epinioExecutor";
import { parseTableLines, isApplicationHealthy } from "../utils/epinioOutputParser";

export class Application {

    private _services: Service[] | [];

    constructor(
        public readonly name: string,
        private readonly epinioExecutor: EpinioExecutor
    ) {
        this._services = [];
    }

    public isApplicationPushedAndHealthy(): boolean {
        return this.epinioExecutor.getAppList().find(item => item.name === this.name && isApplicationHealthy(item))
                ? true
                : false;
    }

    public getApplicationNamespace(): string {
        return this.epinioExecutor.getApplicationNamespace(this.name);
    }

    public getServices(force: boolean = false): Service[] {
        if (this._services === undefined || force) {
            this.refreshServices();
        }
        return this._services || [];
    }

    public refreshServices(): void {
        this._services = this._getServices();
    }

    private _getServices(): Service[] {
        const servicesString = this.epinioExecutor.getConnfigServices();
        const objArray = parseTableLines(servicesString.split(/[\r\n]+/g).filter((item) => item));
        const application = this;
        const executor = this.epinioExecutor;
        return objArray.map(item => new Service(application, item?.name.trim(), executor));
    }

    public push(appSourcePath: string): ChildProcess {
        return this.epinioExecutor.push(this.name, appSourcePath);
    }

    public open(): void {
        return this.epinioExecutor.open(this.name);
    }

    public setEnv(): void {
        return this.epinioExecutor.setEnv(this.name);
    }

    public scaleApplication(): void {
        return this.epinioExecutor.scaleApplication(this.name);
    }

    public getApplicationLogs(): string {
        return this.epinioExecutor.getApplicationLogs(this.name);
    }

    public delete(): ChildProcess {
        return this.epinioExecutor.deleteApplication(this.name);
    }

}
