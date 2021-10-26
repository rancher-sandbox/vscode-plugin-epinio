import { ChildProcess } from "child_process";
import { CommandExecutor } from "./commandExecutor";
import { EpinioCommandNotFound, EpinioExecutorError } from "./exceptions";
import { parseTableLines, getNamespace } from "../utils/epinioOutputParser";
import * as vscode from 'vscode';

export class EpinioExecutor extends CommandExecutor {
    private _outputChannel: vscode.OutputChannel;

    constructor(name: string, cwd: string = '', outputChannel:vscode.OutputChannel) {
        super(cwd, {EPINIO_APPLICATION_NAME: name});
        this._outputChannel = outputChannel;
    }

    getBaseCommand(): string {
        return 'epinio ';
    }

    public getConnfigServices(): string {
        const configServicesCommand = `service list`;
        return this.executeSync(configServicesCommand).toString();
    }

    public getAppList(): any[] {
        const appListCommand = `app list`;
        const appList = this.executeSync(appListCommand).toString()
                                                        .split(/[\r\n]+/g).filter((item) => item);
        return parseTableLines(appList);
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
/*         const epinioCommand = `namespace list`;
        const ret = this.executeSync(epinioCommand)
                        .toString()
                        .split(/[\r\n]+/g).filter((item) => item);
        const namespaces = parseTableLines(ret) || [];
        return namespaces?.find(namespace => namespace?.applications.split(',').find(app => app.trim() === applicationName))?.name || '';
 */   
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
