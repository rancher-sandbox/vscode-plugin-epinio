import { ChildProcess } from "child_process";
import * as vscode from 'vscode';
import { promisifyChildProcess } from "promisify-child-process";
import { TreeItem, TreeDataProvider, EventEmitter, Event, workspace, window, ExtensionContext, Uri, TextDocument, Position } from "vscode";
import { Application } from "../applications/models";
import { ExplorerNode } from "../explorers/views";
import { ApplicationNode, ApplicationsNode } from "../applications/views";
import { ServiceNode } from "../services/views";
import { EpinioExecutor } from "../executors/epinioExecutor";

export class AutoRefreshTreeDataProvider<T> {

    private autoRefreshEnabled: boolean;
    private debounceTimer: NodeJS.Timer;

    constructor(protected context: ExtensionContext) {
        this.autoRefreshEnabled = false; // turned off auto refresh for the time being
    }

    protected _onDidChangeAutoRefresh = new EventEmitter<void>();
    public get onDidChangeAutoRefresh(): Event<void> {
        return this._onDidChangeAutoRefresh.event;
    }

    protected _onDidChangeTreeData = new EventEmitter<void>();
    public get onDidChangeTreeData(): Event<any> {
        return this._onDidChangeTreeData.event;
    }

    public setAutoRefresh(interval: number): void {
        if (interval > 0) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setInterval(() => {
                if (this.autoRefreshEnabled)
                    this.refresh();
            }, interval);
        }
    }

    async refresh(root?: T): Promise<void> {
        this._onDidChangeTreeData.fire();
    }

    public disableAutoRefresh() {
        this.autoRefreshEnabled = false;
    }

    public enableAutoRefresh() {
        this.autoRefreshEnabled = true;
    }

}

export class EpinioProvider extends AutoRefreshTreeDataProvider<any> implements TreeDataProvider<ExplorerNode> {
    
        private _root?: ExplorerNode;
        private _loading: Promise<void> | undefined;
        private _outputChannel: vscode.OutputChannel;

        constructor(
            context: ExtensionContext,
            private files: string[],
            private shell: string,
            private applicationNames: string[],
            outputChannel: vscode.OutputChannel
        ) {
            super(context);
            this._root = new ApplicationsNode(this.context, this.getApplicationNodes()); 
            this._outputChannel = outputChannel;
        }

        protected getRefreshCallable(node?: ExplorerNode, message?: string) {
            let that = this;
            async function refresh() {
                await that.refresh(node);
                message ? vscode.window.showInformationMessage(message) : null;
            }
            return refresh;
        }

        async getChildren(node?:ExplorerNode): Promise<ExplorerNode[]> {
            if (node === undefined) {
                this._root = new ApplicationsNode(this.context, this.getApplicationNodes());      
                node = this._root;
            }
                
            return await node?.getChildren() || [];
        }

        private getApplicationNodes() : Application[] {
            try {
                const epinioExecutor = new EpinioExecutor('', __dirname, this._outputChannel);
                const epinioAppListCmdOutput = epinioExecutor.getAppList();

                return epinioAppListCmdOutput && epinioAppListCmdOutput.length > 0 
                                     ? epinioAppListCmdOutput.map(app => {
                                            return new Application(app.name, epinioExecutor);
                                       })
                                     : [];

            } catch (err:any) {
                window.showErrorMessage("Epinio Error: " + err.message);
                return  [];
            }
        }
     
        async getTreeItem(node: ExplorerNode): Promise<TreeItem> {
            return node.getTreeItem();
        }

        public pushApplication(node: ApplicationNode): void {
            vscode.window.showOpenDialog({
                title: 'Epinio: Select Application source folder',
                canSelectFiles: true,
                canSelectFolders: true
            }).then(res => {
                if(res) {
                    vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: `Pushing App ${node.application.name} ...`,
                        cancellable: false
                    }, async () => {
                        const child_process =  node.application.push(res[0]?.fsPath);
                        child_process.on('close', this.getRefreshCallable(node, `Application ${node.application.name} pushed successfully.`));            
                        await promisifyChildProcess(child_process);
                    });                
                }
            });
        }

        public  pushApplicationFromSource(): void {
            vscode.window.showOpenDialog({
                title: 'Epinio: Select Application source folder',
                canSelectFiles: true,
                canSelectFolders: true
            }).then(res => {
                if(res) {
                    const appName = res[0]?.path.split('/').pop() || 'default-name';
                    const appSourcePath = res[0]?.fsPath;
                    const epinioExecutor = new EpinioExecutor(appName , __dirname, this._outputChannel);
                    vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: `Pushing App ${appName} ...`,
                        cancellable: false
                    }, async () => {
                        const child_process =  epinioExecutor.push(appName , appSourcePath);
                        child_process.on('close', this.getRefreshCallable(this._root, `Application ${appName} pushed successfully.`));                        
                        await promisifyChildProcess(child_process);
                    }); 
                }
            });
        }

        public async openApplication(node: ApplicationNode): Promise<void> {
            return node.application.open();
        }

        public async setApplicationEnv(node: ApplicationNode): Promise<void> {
            return node.application.setEnv();
        }

        public async scaleApplication(node: ApplicationNode): Promise<void> {
            return node.application.scaleApplication();
        }

        public async applicationLogs(node: ApplicationNode): Promise<string> {
            return node.application.getApplicationLogs();
        }
    
        public deleteApplication(node: ApplicationNode): void {
            vscode.window.showInformationMessage(
                `Are you sure you want to delete the app?`,
                { modal: true },
                ...['Yes', 'No'],
            ).then( res =>  {
                if(res === 'Yes') {
                    vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: `Deleting App ${node.application.name} ...`,
                        cancellable: false
                    }, async () => {
                        const child_process =  node.application.delete();
                        child_process.on('close', this.getRefreshCallable(node, `Application ${node.application.name} deleted successfully.`));            
                        await promisifyChildProcess(child_process);
                    });
                } 
            });
        }
    
        public async bindService(node: ServiceNode): Promise<ChildProcess> {
            let child_process = node.service.bind();
            child_process.on('close', this.getRefreshCallable(node));
            return child_process;
        }
    
        public async unbindService(node: ServiceNode): Promise<ChildProcess> {
            let child_process = node.service.unbind();
            child_process.on('close', this.getRefreshCallable(node));
            return child_process;
        }
    
        public async deleteService(node: ServiceNode): Promise<ChildProcess> {
            let child_process = node.service.delete();
            child_process.on('close', this.getRefreshCallable(node));
            return child_process;
        }
    
    }
    