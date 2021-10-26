import { TreeItem, TreeItemCollapsibleState, ExtensionContext, window } from 'vscode';
import { ResourceType } from "../enums";
import { Application } from "./models";
import { ServiceNode } from "../services/views";
import { EpinioNode } from '../epinio/views';

export class ApplicationNode extends EpinioNode {

    constructor(
        context: ExtensionContext,
        public readonly application: Application
    ) {
        super(context);
    }

    async getChildren(): Promise<EpinioNode[]> {
        this.resetChildren();

        const services = this.application.getServices();

        this.children = services
            .map(service => new ServiceNode(this.context, service));
        return this.children;
    }

    getTreeItem(): TreeItem {
        const item = new TreeItem(this.application.name, TreeItemCollapsibleState.Expanded);
        item.contextValue = ResourceType.Application;
        item.collapsibleState = TreeItemCollapsibleState.None;
        item.description = `[ ${this.application.getApplicationNamespace()} ]`;
        const iconPath =  this.application.isApplicationPushedAndHealthy() 
                            ? this.context.asAbsolutePath('resources/app-pushed-healthy.png')
                            : this.context.asAbsolutePath('resources/app-not-pushed.png');
        item.iconPath = {
            dark: iconPath,
            light: iconPath
        };
        return item;
    }
}

export class ApplicationsNode extends EpinioNode {

    constructor(
        context: ExtensionContext,
        private readonly applications: Application[]
    ) {
        super(context);
    }

    async getChildren(): Promise<EpinioNode[]> {
        this.resetChildren();

        this.children = this.applications
            .map(application => new ApplicationNode(this.context, application));
        return this.children;
    }

    getTreeItem(): TreeItem {
        const item = new TreeItem(`Applications`, TreeItemCollapsibleState.None);
        item.contextValue = ResourceType.Applications;
        return item;
    }
}
