import { TreeItem, TreeItemCollapsibleState, ExtensionContext, window } from 'vscode';
import { ResourceType } from "../enums";
import { Namespace } from "./models";
import { ApplicationNode } from "../applications/views";
import { EpinioNode } from '../epinio/views';

export class NamespaceNode extends EpinioNode {

    constructor(
        context: ExtensionContext,
        public readonly namespace: Namespace
    ) {
        super(context);
    }

    async getChildren(): Promise<EpinioNode[]> {
        this.resetChildren();

        const applications = this.namespace.getApplications();

        this.children = applications
            .map(application => new ApplicationNode(this.context, application));
        return this.children;
    }

    getTreeItem(): TreeItem {
        const item = new TreeItem(this.namespace.name, TreeItemCollapsibleState.Expanded);
        item.contextValue = ResourceType.Namespace;
        item.collapsibleState = TreeItemCollapsibleState.Expanded;
        return item;
    }
}

export class NamespacesNode extends EpinioNode {

    constructor(
        context: ExtensionContext,
        private readonly namespaces: Namespace[]
    ) {
        super(context);
    }

    async getChildren(): Promise<EpinioNode[]> {
        this.resetChildren();

        this.children = this.namespaces
            .map(namespace => new NamespaceNode(this.context, namespace));
        return this.children;
    }

    getTreeItem(): TreeItem {
        const item = new TreeItem(`Namespaces`, TreeItemCollapsibleState.None);
        item.contextValue = ResourceType.Namespaces;
        return item;
    }
}
