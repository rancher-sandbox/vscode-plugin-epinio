'use strict';
import * as vscode from 'vscode';
import { promisifyChildProcess } from "promisify-child-process";
import { WorkspaceConfigurator } from "./configurators/workspaceConfigurator";
import { EpinioProvider } from "./explorers/providers";
import { ApplicationNode } from "./applications/views";
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

    const addExplorer = vscode.commands.registerCommand("epinio.application.explorer.add", () => {
        provider.pushApplicationFromSource();
    });

    const refreshExplorer = vscode.commands.registerCommand("epinio.application.explorer.refresh", () => {
        provider.refresh();
    });

    const pushApplication = vscode.commands.registerCommand("epinio.application.push", (node: ApplicationNode) => {
        provider.pushApplication(node);
    });

    const openApplication = vscode.commands.registerCommand("epinio.application.open", (node: ApplicationNode) => {
        provider.openApplication(node);
    });

    const applicationEnv = vscode.commands.registerCommand("epinio.application.env", (node: ApplicationNode) => {
        provider.setApplicationEnv(node);
    });

    const scaleApplication = vscode.commands.registerCommand("epinio.application.scale", (node: ApplicationNode) => {
        provider.scaleApplication(node);
    });

    const applicationLogs = vscode.commands.registerCommand("epinio.application.logs", (node: ApplicationNode) => {
        provider.applicationLogs(node);
    });

    const deleteApplication = vscode.commands.registerCommand("epinio.application.delete", (node: ApplicationNode) => {
/*         vscode.window.showInformationMessage(
            `Are you sure you want to delete the app?`,
            { modal: true },
            ...['Yes', 'No'],
        ).then( res =>  {
            if(res === 'Yes') {
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Deleting App...",
                    cancellable: false
                }, async () => {
                    return await promisifyChildProcess(provider.deleteApplication(node));
                });
            } 
        }); */
        provider.deleteApplication(node);
    });

    const bindService = vscode.commands.registerCommand("epinio.service.bind", (node: ServiceNode) => {
        provider.bindService(node);
    });

    const unbindService = vscode.commands.registerCommand("epinio.service.unbind", (node: ServiceNode) => {
        provider.unbindService(node);
    });

    const deleteService = vscode.commands.registerCommand("epinio.service.delete", (node: ServiceNode) => {
        provider.deleteService(node);
    });

    context.subscriptions.push(addExplorer);
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
