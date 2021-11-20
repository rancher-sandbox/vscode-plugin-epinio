'use strict';
import * as vscode from 'vscode';
import { WorkspaceConfigurator } from "./configurators/workspaceConfigurator";
import { EpinioApplicationProvider, EpinioConfigProvider } from "./explorers/providers";
import { ApplicationNode } from "./applications/views";
import { ServiceNode } from "./services/views";
import { NamespaceNode } from './namespaces/views';
import { LocalStorageService } from './utils/localStorageService';
import { ConfigNode } from './configs/views';

export function activate(context: vscode.ExtensionContext) {
    const disposables: vscode.Disposable[] = [];

    const interval = WorkspaceConfigurator.getConfiguration().get<number>("autoRefreshInterval") || 10000;
    const outputChannel = vscode.window.createOutputChannel('Epino');
    const storageManager = new LocalStorageService(context.workspaceState);

    const applicationProvider = new EpinioApplicationProvider(context, outputChannel, storageManager);
    const configProvider = new EpinioConfigProvider(context, outputChannel, storageManager);
    applicationProvider.setAutoRefresh(interval);

    vscode.window.registerTreeDataProvider("epinio.application", applicationProvider);
    vscode.window.registerTreeDataProvider("epinio.config", configProvider);

    vscode.commands.registerCommand('epinio.showOutput', () => outputChannel.show());
    disposables.push(outputChannel);

    const addConfig = vscode.commands.registerCommand("epinio.config.explorer.add", () => {
        configProvider.addConfig();
    });

    const deleteConfig = vscode.commands.registerCommand("epinio.config.delete", (node: ConfigNode) => {
        configProvider.deleteConfig(node);
    });

    const activeConfig = vscode.commands.registerCommand("epinio.config.active", (node: ConfigNode) => {
        configProvider.setActiveConfigNode(node);
        applicationProvider.refresh();
    });

    const createNamespace = vscode.commands.registerCommand("epinio.application.explorer.createNamespace", () => {
        applicationProvider.createNamespace();
    });

    const deleteNamespace = vscode.commands.registerCommand("epinio.namespace.delete", (node: NamespaceNode) => {
        applicationProvider.deleteNamespace(node);
    });

    const pushAppFromSourceInNamespace = vscode.commands.registerCommand("epinio.namespace.pushAppFromSource", (node: NamespaceNode) => {
        applicationProvider.pushApplicationFromSource(node);
    });

    const pushAppFromManifestInNamespace = vscode.commands.registerCommand("epinio.namespace.pushAppFromManifest", (node: NamespaceNode) => {
        applicationProvider.pushApplicationFromManifest(node);
    });

    const refreshExplorer = vscode.commands.registerCommand("epinio.application.explorer.refresh", () => {
        applicationProvider.refresh();
    });

    const rePushApplication = vscode.commands.registerCommand("epinio.application.repush", (node: ApplicationNode) => {
        applicationProvider.rePushApplication(node);
    });

    const openApplication = vscode.commands.registerCommand("epinio.application.open", (node: ApplicationNode) => {
        applicationProvider.openApplication(node);
    });

    const applicationEnv = vscode.commands.registerCommand("epinio.application.env", (node: ApplicationNode) => {
        applicationProvider.setApplicationEnv(node);
    });

    const scaleApplication = vscode.commands.registerCommand("epinio.application.scale", (node: ApplicationNode) => {
        applicationProvider.scaleApplication(node);
    });

    const applicationLogs = vscode.commands.registerCommand("epinio.application.logs", (node: ApplicationNode) => {
        applicationProvider.applicationLogs(node);
    });

    const deleteApplication = vscode.commands.registerCommand("epinio.application.delete", (node: ApplicationNode) => {
        applicationProvider.deleteApplication(node);
    });

    const bindService = vscode.commands.registerCommand("epinio.service.bind", (node: ServiceNode) => {
        applicationProvider.bindService(node);
    });

    const unbindService = vscode.commands.registerCommand("epinio.service.unbind", (node: ServiceNode) => {
        applicationProvider.unbindService(node);
    });

    const deleteService = vscode.commands.registerCommand("epinio.service.delete", (node: ServiceNode) => {
        applicationProvider.deleteService(node);
    });

    context.subscriptions.push(addConfig);
    context.subscriptions.push(deleteConfig);
    context.subscriptions.push(activeConfig);
    context.subscriptions.push(pushAppFromSourceInNamespace);
    context.subscriptions.push(pushAppFromManifestInNamespace);
    context.subscriptions.push(createNamespace);
    context.subscriptions.push(deleteNamespace);
    context.subscriptions.push(refreshExplorer);
    context.subscriptions.push(rePushApplication);
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
