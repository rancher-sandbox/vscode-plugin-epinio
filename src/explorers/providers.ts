import { ChildProcess } from "child_process";
import * as fs from 'fs';
import * as vscode from 'vscode';
import { promisifyChildProcess } from "promisify-child-process";
import { TreeItem, TreeDataProvider, EventEmitter, Event, workspace, window, ExtensionContext, Uri, TextDocument, Position } from "vscode";
import { ExplorerNode } from "../explorers/views";
import { ApplicationNode } from "../applications/views";
import { ServiceNode } from "../services/views";
import { EpinioExecutor } from "../executors/epinioExecutor";
import { Config } from "../configs/models";
import { Namespace } from "../namespaces/models";
import { NamespaceNode, NamespacesNode } from "../namespaces/views";
import { LocalStorageService } from '../utils/localStorageService';
import { ConfigNode, ConfigsNode } from "../configs/views";
import { config } from "process";

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

export class EpinioConfigProvider extends AutoRefreshTreeDataProvider<any> implements TreeDataProvider<ExplorerNode> {
        private _root?: ExplorerNode;
        private _outputChannel: vscode.OutputChannel;
        private _storageManager: LocalStorageService;
        private _epinioExecutor: EpinioExecutor;

        constructor(
            context: ExtensionContext,
            outputChannel: vscode.OutputChannel,
            storageManager: LocalStorageService
        ) {
            super(context);
            this._outputChannel = outputChannel;
            this._storageManager = storageManager;
            this._epinioExecutor = new EpinioExecutor('', __dirname, outputChannel, storageManager);
        }

        async getChildren(node?:ExplorerNode): Promise<ExplorerNode[]> {
            if (node === undefined) {
                this._root = new ConfigsNode(this.context, this.getConfigNodes());      
                node = this._root;
            }
                
            return await node?.getChildren() || [];
        }

        async getTreeItem(node: ExplorerNode): Promise<TreeItem> {
            return node.getTreeItem();
        }

        private getConfigNodes() : Config[] {
            const configList = this._storageManager.getValue("configList") as any[];
            return configList && configList.length > 0    
            ? configList.map(config => new Config(config?.path, config?.active, this._epinioExecutor))
            : []
        }

        public  addConfig(): void {
            vscode.window.showOpenDialog({
                title: 'Epinio: Select config file',
                canSelectFiles: true,
                canSelectFolders: false
            }).then(res => {
                if(res) {
                    const configList = this._storageManager.getValue("configList") as any[] || [];
                    if(!configList.find(config => config?.path === res[0]?.fsPath)) {
                        const newConfigList = [
                            ...configList,
                            configList.length === 0 ? {path: res[0]?.fsPath, active: true} : {path: res[0]?.fsPath, active: false}
                        ];
                        this._storageManager.setValue("configList", newConfigList);
                        this._onDidChangeTreeData.fire();
                    }                    
                }
            });
        }

        public async setActiveConfigNode(node: ConfigNode): Promise<void> {
            const configList = this._storageManager.getValue("configList") as any[] || [];
            if(!configList.find(config => config?.path === node.config.name).active) {
                const newConfigList = configList.map(config => {
                    return {
                        ...config,
                        active: config?.path === node.config.name ? true : false
                    }
                });
                this._storageManager.setValue("configList", newConfigList);
                this._onDidChangeTreeData.fire();
                return node.config.setActive();                         
            }
        }

        public deleteConfig(node: ConfigNode): void {
            const configList = this._storageManager.getValue("configList") as any[] || [];
            // if(!configList.find(config => config?.path === node.config.name).active) {
                vscode.window.showInformationMessage(
                    `Are you sure you want to delete the Config?`,
                    { modal: true },
                    ...['Yes', 'No'],
                ).then( res =>  {
                    if(res === 'Yes') {
                        const newConfigList = [...configList.filter(config => config?.path !== node.config.name)];
                        this._storageManager.setValue("configList", newConfigList);
                        this._onDidChangeTreeData.fire();
                    }
                });
/*             } else {
                vscode.window.showInformationMessage(
                    `Active Config cannot be deleted!`,
                    { modal: true },
                    ...['Ok'],
                );
            } */
        }

}

export class EpinioApplicationProvider extends AutoRefreshTreeDataProvider<any> implements TreeDataProvider<ExplorerNode> {
    
        private _root?: ExplorerNode;
        private _outputChannel: vscode.OutputChannel;
        private _storageManager: LocalStorageService;
        private _epinioExecutor: EpinioExecutor;

        constructor(
            context: ExtensionContext,
            outputChannel: vscode.OutputChannel,
            storageManager: LocalStorageService
        ) {
            super(context);
            this._outputChannel = outputChannel;
            this._storageManager = storageManager;
            this._epinioExecutor = new EpinioExecutor('', __dirname, outputChannel, storageManager);
        }

        protected getRefreshCallable(node?: ExplorerNode, message?: string) {
            const that = this;
            async function refresh() {
                await that.refresh(node);
                message ? vscode.window.showInformationMessage(message) : null;
            }
            return refresh;
        }

        protected onPushSuccess(appName: string, appSourcePath: string, node?: ExplorerNode) {
            const uri = Uri.file(appSourcePath);
            const that = this;
            async function refresh() {
                await that.refresh(node);
                vscode.window.showInformationMessage(`Application ${appName} pushed successfully.`);
                workspace.updateWorkspaceFolders(workspace.workspaceFolders ? workspace.workspaceFolders.length : 0, null, { uri });
                that._storageManager.setValue(appName, appSourcePath);    
            }
            return refresh;
        }

        protected onDeleteSuccess(node?: ApplicationNode) {
            const that = this;
            async function refresh() {
                const appName = node?.application?.name;
                await that.refresh(node);
                vscode.window.showInformationMessage(`Application ${appName} deleted successfully.`);
/*                 const appSourcePath = that._storageManager.getValue(appName);  
                const folders  = workspace.workspaceFolders;
                const folderIndex = folders.findIndex(item => item.uri.fsPath === appSourcePath);
                folderIndex >= 0
                ? workspace.updateWorkspaceFolders(folderIndex, 1)
                : null; */ //this lines of code is to delete source folder from workspace.
                that._storageManager.setValue(appName, undefined); 
            }
            return refresh;
        }

        async getChildren(node?:ExplorerNode): Promise<ExplorerNode[]> {
            if (node === undefined) {
                this._root = new NamespacesNode(this.context, this.getNamespaceNodes());      
                node = this._root;
            }
                
            return await node?.getChildren() || [];
        }

        private getNamespaceNodes() : Namespace[] {
            try {
                const epinioNamespaceListCmdOutput = this._epinioExecutor.getNamespaceList();

                return epinioNamespaceListCmdOutput && epinioNamespaceListCmdOutput.length > 0 
                                     ? epinioNamespaceListCmdOutput.map(namespace => {
                                            return new Namespace(namespace.name, this._epinioExecutor);
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

        public rePushApplication(node: ApplicationNode): void {
            const appSourceOrManifestPath = this._storageManager.getValue(node.application.name) as string;
            if(appSourceOrManifestPath) {
                const appName = node.application.name;
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Re-Pushing App ${appName} ...`,
                    cancellable: false
                }, async () => {
                    const child_process =  fs.existsSync(appSourceOrManifestPath) && fs.lstatSync(appSourceOrManifestPath).isDirectory()
                                        ? node.application.push(appSourceOrManifestPath)
                                        : node.application.pushFromManifest(appSourceOrManifestPath);
                    child_process.on('close', this.onPushSuccess(appName, appSourceOrManifestPath, this._root));    
                    await promisifyChildProcess(child_process);
                });  
            } else {
                vscode.window.showOpenDialog({
                    title: 'Epinio: Select Application source folder',
                    canSelectFiles: true,
                    canSelectFolders: true
                }).then(res => {
                    if(res) {
                        const appName = res[0]?.path.split('/').pop() || 'default-name';
                        const appSourcePath = res[0]?.fsPath;
                        vscode.window.withProgress({
                            location: vscode.ProgressLocation.Notification,
                            title: `Pushing App ${appName} ...`,
                            cancellable: false
                        }, async () => {
                            this._epinioExecutor.setNamespace(node.application.namespace.name);
                            const child_process =  this._epinioExecutor.push(appName , appSourcePath);
                            child_process.on('close', this.onPushSuccess(appName, appSourcePath, this._root));                        
                            await promisifyChildProcess(child_process);
                        }); 
                    }
                });
            }             
        }

        public  pushApplicationFromSource(node: NamespaceNode): void {
            vscode.window.showOpenDialog({
                title: 'Epinio: Select Application source folder',
                canSelectFiles: true,
                canSelectFolders: true
            }).then(res => {
                if(res) {
                    const appName = res[0]?.path.split('/').pop() || 'default-name';
                    const appSourcePath = res[0]?.fsPath;
                    vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: `Pushing App ${appName} ...`,
                        cancellable: false
                    }, async () => {
                        this._epinioExecutor.setNamespace(node.namespace.name);
                        const child_process =  this._epinioExecutor.push(appName , appSourcePath);
                        child_process.on('close', this.onPushSuccess(appName, appSourcePath, this._root));                        
                        await promisifyChildProcess(child_process);
                    }); 
                }
            });
        }

        public  pushApplicationFromManifest(node: NamespaceNode): void {
            vscode.window.showOpenDialog({
                title: 'Epinio: Select Application manifest file',
                canSelectFiles: true,
                canSelectFolders: false
            }).then(res => {
                if(res) {
                    const appName = '';
                    const appManifestPath = res[0]?.fsPath;
                    vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: `Pushing App ${appName} ...`,
                        cancellable: false
                    }, async () => {
                        const child_process =  this._epinioExecutor.pushFromManifest(appName , appManifestPath);
                        child_process.on('close', this.onPushSuccess(appName, appManifestPath, this._root));                        
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
                        child_process.on('close', this.onDeleteSuccess(node));            
                        await promisifyChildProcess(child_process);
                    });
                } 
            });
        }

        public async getNamespaceNameInput() : Promise<string> {
            return await vscode.window.showInputBox({
                value: 'defaultnamespace',
                placeHolder: 'Enter Namespace'
            }) || '';
        }

        public async createNamespace(): Promise<void> {
            this.getNamespaceNameInput().then(res => {
                if(res) {
                    vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: `Creating Namespace ${res} ...`,
                        cancellable: false
                    }, async () => {
                        const child_process =  this._epinioExecutor.createNamespace(res);
                        child_process.on('close', this.getRefreshCallable(this._root, `Namespace ${res} created successfully.`));                        
                        await promisifyChildProcess(child_process);
                    }); 
                }
            });
        }

        public deleteNamespace(node: NamespaceNode): void {
            vscode.window.showInformationMessage(
                `Are you sure you want to delete the namespace?`,
                { modal: true },
                ...['Yes', 'No'],
            ).then( res =>  {
                if(res === 'Yes') {
                    vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: `Deleting Namespace ${node.namespace.name} ...`,
                        cancellable: false
                    }, async () => {
                        const child_process =  node.namespace.delete();
                        child_process.on('close', this.getRefreshCallable(node, `Namespace ${node.namespace.name} deleted successfully.`));            
                        await promisifyChildProcess(child_process);
                    });
                } 
            });
        }
    
        public async bindService(node: ServiceNode): Promise<ChildProcess> {
            const child_process = node.service.bind();
            child_process.on('close', this.getRefreshCallable(node));
            return child_process;
        }
    
        public async unbindService(node: ServiceNode): Promise<ChildProcess> {
            const child_process = node.service.unbind();
            child_process.on('close', this.getRefreshCallable(node));
            return child_process;
        }
    
        public async deleteService(node: ServiceNode): Promise<ChildProcess> {
            const child_process = node.service.delete();
            child_process.on('close', this.getRefreshCallable(node));
            return child_process;
        }
    
    }
    