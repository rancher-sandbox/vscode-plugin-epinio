import { TreeItem, TreeItemCollapsibleState, ExtensionContext } from "vscode";
import { ResourceType } from "../enums";
import { Service } from "../services/models";
import { EpinioNode } from "../epinio/views";

export class ServiceNode extends EpinioNode {

    constructor(
        context: ExtensionContext,
        public readonly service: Service
	) {
		super(context);
    }

    async getChildren(): Promise<EpinioNode[]> {
        this.resetChildren();

        return [];
    }

    async getTreeItem(): Promise<TreeItem> {
        const item = new TreeItem(this.service.name, TreeItemCollapsibleState.Expanded);
        // item.iconPath = this.iconPath;
        item.contextValue = ResourceType.Service;
        return item;
    }
}
