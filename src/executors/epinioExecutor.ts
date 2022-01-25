import { ChildProcess } from "child_process";
import { CommandExecutor } from "./commandExecutor";
import { EpinioCommandNotFound, EpinioExecutorError } from "./exceptions";
import { parseTableLines, getNamespace } from "../utils/epinioOutputParser";
import * as vscode from 'vscode';
import { LocalStorageService } from "../utils/localStorageService";
import { promisifyChildProcess } from "promisify-child-process";
import { IClusterInfo } from "../configurators/models";
import { EpinioApiExecutor } from "./epinioApiExecutor";

export class EpinioExecutor extends CommandExecutor {
    private _outputChannel: vscode.OutputChannel;
    private _storageManager: LocalStorageService;
    private _activeConfigFile: string;
    private _epinioAPIExecutor: EpinioApiExecutor;

    constructor(name: string, cwd: string = '', outputChannel:vscode.OutputChannel, storageManager: LocalStorageService) {
        super(cwd, {EPINIO_RESOURCE_NAME: name});
        this._outputChannel = outputChannel;
        this._storageManager = storageManager;
        const configs  = this._storageManager.getValue("epinio") as IClusterInfo[] || [];
        this._activeConfigFile = configs.find(info => info?.config.active)?.config.path;
        this._epinioAPIExecutor = this._activeConfigFile && this._activeConfigFile !== ''
                                  ? new EpinioApiExecutor(this._activeConfigFile)
                                  : null;
    }

    getBaseApiEndpoint(): string {
        // this._epinioAPIExecutor.setConfig(this._activeConfigFile);
        return 'namespaces';
    }

    getBaseCommand(): string {
        if(this._activeConfigFile && this._activeConfigFile !== '') {
            return `epinio --config-file ${this._activeConfigFile}`;
        } else {
            vscode.window.showInformationMessage(
                `No Active Epinio Cluster connection found! Please add a Cluster connection via Config file to start using Epinio`,
                { modal: true },
                ...['Ok'],
           );
           return null;
        }
    }

    public setActiveConfig(): void { // not required with apis??
        const configUpdateCommand = `config update`;
        this.executeSync(configUpdateCommand);
    }

    public deleteConfig(config:string): void {

    }

    public getConnfigServices(): string {
        const configServicesCommand = `service list`;
        return this.executeSync(configServicesCommand).toString();
    }

    public setNamespace(namespace: string): void { // not required with apis??
        const setNamespaceCommand = `target ${namespace}`;
        this.executeSync(setNamespaceCommand);
    }

    public async _getAppListByNamespace(namespace: string) {
        const apiEndPoint = `${this.getBaseApiEndpoint()}/${namespace}/applications`;
        const ret = await this._epinioAPIExecutor.get(this._activeConfigFile, apiEndPoint);
        return ret;
    }

    public getAppListByNamespace(namespace: string): any[] {
        const appListCommand = `app list`;
        const appList = this.executeSync(appListCommand)?.toString()
                                                        ?.split(/[\r\n]+/g).filter((item) => item) || [];
        const appListJSON = parseTableLines(appList);
        return appListJSON.filter(app =>this.getApplicationNamespace(app.name)=== namespace);
    }

    public async _getNamespaceList() {
        const apiEndPoint = `${this.getBaseApiEndpoint()}`;
        return await this._epinioAPIExecutor.get(this._activeConfigFile, apiEndPoint);
    }

    public getNamespaceList(): any[] {
        const junk = this._getNamespaceList();
        const nameSpaceListCommand = `namespace list`;
        const nameSpaceList = this.executeSync(nameSpaceListCommand)?.toString()
                                                        ?.split(/[\r\n]+/g).filter((item) => item) || [];
        return parseTableLines(nameSpaceList);
    }

    public getAppUrl(appName:string): string {
        const appInfoCommand = `app show ${appName}`;
        const appInfo = this.executeSync(appInfoCommand)
                            .toString()
                            .split(/[\r\n]+/g).filter((item) => item);
        const appInfoObjArray = parseTableLines(appInfo);
        const appRoute = appInfoObjArray.find(item => item.key === 'Routes')?.value.trim();
        return `https://${appRoute}`;
    }

    public bind(serviceName?: string): ChildProcess {
        const epinioCommand = serviceName === undefined ? `` : ` ${serviceName}`;
        return this.execute(epinioCommand);
    }

    public unbind(serviceName?: string): ChildProcess {
        const epinioCommand = serviceName === undefined ? `` : ` ${serviceName}`;
        return this.execute(epinioCommand);
    }

    public deleteService(serviceName?: string): ChildProcess {
        const epinioCommand = `service delete ${serviceName}`;
        return this.execute(epinioCommand);
    }

    public push(applicationName: string, appSourcePath: string): ChildProcess {
        const epinioCommand = `app push --name ${applicationName} --path ${appSourcePath}`;
        return this.execute(epinioCommand);
    }

    public pushFromManifest(applicationName: string, appManifestPath: string): ChildProcess {
        const epinioCommand = `app push ${appManifestPath}`;
        return this.execute(epinioCommand);
    }

    public open(applicationName: string): void {
        const appUrl = this.getAppUrl(applicationName);
        vscode.env.openExternal(vscode.Uri.parse(appUrl));
    }

    public async getEnvironmentVariableInput() : Promise<string> {
        return await vscode.window.showInputBox({
            value: 'TEST_ENV=my_value',
            placeHolder: 'Set Env variable. Example: TEST_ENV=my_value',
            validateInput: text => {
                return text.split('=').length < 2 ? 'Doesnt satisfy the format TEST_ENV=my_value' : null;
            }
        }) || '';
    }

    public setEnv(applicationName: string): void {
        this.getEnvironmentVariableInput().then(res => {
            const [variable, value] = res.split('=');
            if(variable && value) {
                const epinioCommand = `app env set ${applicationName} ${variable} ${value}`;
                this.executeSync(epinioCommand).toString();
                vscode.window.showInformationMessage(`Set Environment variable for ${applicationName} successful.`);
            } else {
                vscode.window.showInformationMessage(`Something went wrong with Set Environment variable for ${applicationName}.`);
            }
        });
    }

    public async getApplicationScaleInput() : Promise<string> {
        return await vscode.window.showInputBox({
            value: '1',
            placeHolder: 'Scale application. Example: 2',
            validateInput: text => {
                return isNaN(Number(text)) ? 'Not a number! Please enter a valid integer.' : null;
            }
        }) || '1';
    }

    public scaleApplication(applicationName: string): void {
        this.getApplicationScaleInput().then(res => {
            const scale = Number(res);
            const epinioCommand = `app update ${applicationName} --instances=${scale}`;
            this.executeSync(epinioCommand).toString();
            vscode.window.showInformationMessage(`Application ${applicationName} scaled to ${scale} instances.`);
        });
    }

    public getApplicationLogs(applicationName?: string): string {
        const epinioCommand = `app logs ${applicationName}`;
        const ret = this.executeSync(epinioCommand).toString();
        this._outputChannel.clear();
        this._outputChannel.append(ret);
        this._outputChannel.show(true);
        return ret;
    }

    public getApplicationNamespace(applicationName: string): string {   
        const epinioCommand = `app show ${applicationName}`;
        const ret = this.executeSync(epinioCommand)
                        .toString()
                        .split(/[\r\n]+/g).filter((item) => item);
        return getNamespace(ret);
    }

    public deleteApplication(applicationName?: string): ChildProcess {
        const epinioCommand = `app delete ${applicationName}`;
        return this.execute(epinioCommand);
    }

    public async _createNamespace(nameSpace?: string) : Promise<any> {
        const apiEndPoint = `${this.getBaseApiEndpoint()}`;
        const data = JSON.stringify({
            "name": nameSpace
        });
        const ret = await this._epinioAPIExecutor.post(this._activeConfigFile, apiEndPoint, data);
        return ret;
    }

    public createNamespace(nameSpace?: string): ChildProcess {
        const epinioCommand = `namespace create ${nameSpace}`;
        return this.execute(epinioCommand);
    }

    public deleteNamespace(namespace?: string): ChildProcess {
        const epinioCommand = `namespace delete ${namespace} --force`;
        return this.execute(epinioCommand);
    }

    public executeSync(epinioCommand: string) {
        try {
            return super.executeSync(epinioCommand);
        }
        catch (err:any) {
            if (err.message.includes("'epinio' is not recognized"))
                throw new EpinioCommandNotFound(err.message, err.output);
            else {
                this._outputChannel.appendLine(err.message);
                this._outputChannel.show(true);
                throw new EpinioExecutorError(err.message, err.output);
            }
        }
    }

}
