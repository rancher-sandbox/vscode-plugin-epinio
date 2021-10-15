'use strict';
import * as vscode from 'vscode';
import { Application } from "./applications/models";

import { WorkspaceConfigurator } from "./configurators/workspaceConfigurator";
import { EpinioProvider } from "./explorers/providers";
import { ApplicationNode, ApplicationsNode } from "./applications/views";
import { ServiceNode } from "./services/views";

export function activate(context: vscode.ExtensionContext) {
    const disposables: vscode.Disposable[] = [];
    const configuration = WorkspaceConfigurator.getConfiguration();

    const interval = WorkspaceConfigurator.getConfiguration().get<number>("autoRefreshInterval") || 10000;
    const files = configuration.get<string[]>("files") || [];
    const shell = configuration.get<string>("shell") || '';
    const applicationNames = configuration.get<string[]>("applicationNames") || [];
    const outputChannel = vscode.window.createOutputChannel('Epino');


    const provider = new EpinioProvider(context, files, shell, applicationNames, outputChannel);
    provider.setAutoRefresh(interval);

    vscode.window.registerTreeDataProvider("epinio.application", provider);

    vscode.commands.registerCommand('epinio.showOutput', () => outputChannel.show());
    disposables.push(outputChannel);

    let refreshExplorer = vscode.commands.registerCommand("epinio.application.explorer.refresh", () => {
        provider.refresh();
    });

    let pushApplication = vscode.commands.registerCommand("epinio.application.push", (node: ApplicationNode) => {
        provider.pushApplication(node);
    });

    let openApplication = vscode.commands.registerCommand("epinio.application.open", (node: ApplicationNode) => {
        provider.openApplication(node);
    });

    let applicationEnv = vscode.commands.registerCommand("epinio.application.env", (node: ApplicationNode) => {
        provider.applicationEnv(node);
    });

    let scaleApplication = vscode.commands.registerCommand("epinio.application.scale", (node: ApplicationNode) => {
        provider.scaleApplication(node);
    });

    let applicationLogs = vscode.commands.registerCommand("epinio.application.logs", (node: ApplicationNode) => {
        provider.applicationLogs(node);
    });

    let deleteApplication = vscode.commands.registerCommand("epinio.application.delete", (node: ApplicationNode) => {
        provider.deleteApplication(node);
    });

    let bindService = vscode.commands.registerCommand("epinio.service.bind", (node: ServiceNode) => {
        provider.bindService(node);
    });

    let unbindService = vscode.commands.registerCommand("epinio.service.unbind", (node: ServiceNode) => {
        provider.unbindService(node);
    });

    let deleteService = vscode.commands.registerCommand("epinio.service.delete", (node: ServiceNode) => {
        provider.deleteService(node);
    });

    context.subscriptions.push(refreshExplorer);
    context.subscriptions.push(pushApplication);
    context.subscriptions.push(openApplication);
    context.subscriptions.push(applicationEnv);
    context.subscriptions.push(scaleApplication);
    context.subscriptions.push(applicationLogs);
    context.subscriptions.push(deleteApplication);
    context.subscriptions.push(bindService);
    context.subscriptions.push(unbindService);
    context.subscriptions.push(deleteService);
}

export function deactivate() {
}
