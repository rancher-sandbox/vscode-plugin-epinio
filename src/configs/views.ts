import { TreeItem, TreeItemCollapsibleState, ExtensionContext, window } from 'vscode';
import { ResourceType } from "../enums";
import { Config } from "./models";
import { EpinioNode } from '../epinio/views';

export class ConfigNode extends EpinioNode {

    constructor(
        context: ExtensionContext,
        public readonly config: Config
    ) {
        super(context);
    }

    async getChildren(): Promise<EpinioNode[]> {
        this.resetChildren();

        this.children = [];
        return this.children;
    }

    getTreeItem(): TreeItem {
        const item = new TreeItem(this.config.name, TreeItemCollapsibleState.Expanded);
        item.contextValue = ResourceType.Config;
        item.collapsibleState = TreeItemCollapsibleState.None;
        item.iconPath = {
            dark: this.context.asAbsolutePath('resources/dark/document.svg'),
            light: this.context.asAbsolutePath('resources/light/document.svg')
        };
        item.label = this.config.active ? `*${this.config.name}` : ` ${this.config.name}`;
        return item;
    }
}

export class ConfigsNode extends EpinioNode {

    constructor(
        context: ExtensionContext,
        private readonly configs: Config[]
    ) {
        super(context);
    }

    async getChildren(): Promise<EpinioNode[]> {
        this.resetChildren();

        this.children = this.configs
            .map(config => new ConfigNode(this.context, config));
        return this.children;
    }

    getTreeItem(): TreeItem {
        const item = new TreeItem(`Configs`, TreeItemCollapsibleState.None);
        item.contextValue = ResourceType.Configs;
        return item;
    }
}
