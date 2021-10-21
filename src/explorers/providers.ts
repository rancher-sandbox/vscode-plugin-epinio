import { ChildProcess } from "child_process";
import * as vscode from 'vscode';
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

        public async pushApplication(node: ApplicationNode, appSourcePath: string): Promise<ChildProcess> {
            const child_process =  node.application.push(appSourcePath);
            child_process.on('close', this.getRefreshCallable(node, `Application ${node.application.name} pushed successfully.`));
            return child_process;
        }

        public async pushApplicationFromSource(appName:string, appSourcePath: string): Promise<ChildProcess> {
            const epinioExecutor = new EpinioExecutor(appName, __dirname, this._outputChannel);

            const child_process =  epinioExecutor.push(appName, appSourcePath);
            child_process.on('close', this.getRefreshCallable(this._root, `Application ${appName} pushed successfully.`));
            return child_process;
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
            return await node.application.getApplicationLogs();
        }
    
        public async deleteApplication(node: ApplicationNode): Promise<ChildProcess> {
            const child_process =  node.application.delete();
            child_process.on('close', this.getRefreshCallable(node, `Application ${node.application.name} deleted successfully.`));
            return child_process;
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
    