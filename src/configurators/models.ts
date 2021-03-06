import * as vscode from 'vscode';

export interface IEpinioConfig {
    enabled: boolean;
    applicationName: string;
    autoRefreshInterval: number;
    showEpinio: boolean;
    enableTelemetry: boolean;
    shell: string;
    files: string[];
}

export const emptyConfig: IEpinioConfig = {
    enabled: true,
    applicationName: '',
    autoRefreshInterval: 10000,
    showEpinio: true,
    enableTelemetry: false,
    shell: "/bin/sh",
    files: ["epinio.yml"]
}

export interface IEpinioApp {
    name: string;
    sourcePath: string;
}

export interface IClusterConfig {
    path: string;
    active: boolean;
}

export interface IClusterInfo {
    config: IClusterConfig,
    apps?: IEpinioApp[]
}
