import { ExtensionContext, TreeItem, TreeItemCollapsibleState } from 'vscode';
import { ResourceType } from "../enums";
import { EpinioExecutorError, EpinioCommandNotFound } from "../executors/exceptions";
import { ExplorerNode } from '../explorers/views';

export class MessageNode extends ExplorerNode {

    constructor(
        public readonly context: ExtensionContext,
        private readonly message: string
    ) {
        super(context);
    }

    getChildren(): EpinioNode[] | Promise<EpinioNode[]> {
        return [];
    }

    getTreeItem(): TreeItem | Promise<TreeItem> {
        const item = new TreeItem(this.message, TreeItemCollapsibleState.None);
        item.contextValue = ResourceType.Message;
        return item;
    }

    handleError(err: Error): EpinioNode[] | Promise<EpinioNode[]> {
        return [];
    }
        
}

export abstract class EpinioNode extends ExplorerNode {

    protected children: EpinioNode[] | undefined;

    handleError(err: Error): MessageNode[] {
        if (err instanceof EpinioCommandNotFound) {
            return [new MessageNode(this.context, 'epinio command not found')];
        } else if (err instanceof EpinioExecutorError) {
            return [new MessageNode(this.context, 'Failed to execute script epinio')];
        } else {
            return [new MessageNode(this.context, 'unexpected error')];
        }
    }

}
