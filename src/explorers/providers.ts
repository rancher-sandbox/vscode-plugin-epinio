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
        this.autoRefreshEnabled = true;
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
            let applications:any[] = [];
            if (vscode.workspace && vscode.workspace.workspaceFolders) {
                applications = vscode.workspace.workspaceFolders.map((folder) => {
                    // application name from mapping or use workspace dir name
                    let name = applicationNames[folder.index] || folder.name.replace(/[^-_a-z0-9]/gi, '');
                    let epinioExecutor = new EpinioExecutor(name, files, shell, folder.uri.fsPath, outputChannel);
                    return new Application(name, epinioExecutor);
                });
            }
            this._root = new ApplicationsNode(this.context, applications);
            this._outputChannel = outputChannel;
        }

        protected getRefreshCallable(node: ExplorerNode) {
            let that = this;
            async function refresh() {
                await that.refresh(node);
            }
            return refresh;
        }

        async getChildren(node?:ExplorerNode): Promise<ExplorerNode[]> {
            if (this._loading !== undefined) {
                await this._loading;
                this._loading = undefined;
            }
        
            if (node === undefined) node = this._root;

            try {
                return await node?.getChildren() || [];
            } catch (err:any) {
                window.showErrorMessage("Epinio Error: " + err.message);
                return await node?.handleError(err) || [];
            }
        }
    
        async getTreeItem(node: ExplorerNode): Promise<TreeItem> {
            return node.getTreeItem();
        }

        public async pushApplication(node: ApplicationNode): Promise<string> {
            const ret = await node.application.push();
            this.refresh();
            return ret;
        }

        public async openApplication(node: ApplicationNode): Promise<void> {
            return node.application.open();
        }

        public async applicationEnv(node: ApplicationNode): Promise<void> {
            return node.application.setEnv();
        }

        public async scaleApplication(node: ApplicationNode): Promise<void> {
            return node.application.scaleApplication();
        }

        public async applicationLogs(node: ApplicationNode): Promise<string> {
            return await node.application.getApplicationLogs();
        }
    
        public async deleteApplication(node: ApplicationNode): Promise<string> {
            const ret  = node.application.delete();
            this.refresh();
            return ret;
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
    
        public async deleteService(node: ServiceNode): Promise<string> {
/*             let child_process = node.service.stop();
            child_process.on('close', this.getRefreshCallable(node));
            return child_process; */
            return await node.service.delete();
        }
    
    }
    