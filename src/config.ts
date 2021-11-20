import yaml from 'yaml';
import * as fs from 'fs';
import * as path from 'path';
import { WorkspaceConfigurator } from "./configurators/workspaceConfigurator";

export class Config {

    'api' = 'https://epinio.172.21.239.146.omg.howdoi.website';
    'certs' = '';
    'colors' = 'true';
    'namespace' = 'workspace';
    'org' = 'workspace';
    'pass' = '6a3307208f9ba266';
    'user' = 'c6e8e1880afc2cc2';

    constructor(properties) {
        this.addAll(properties);
    }

    public get(key: string): any {
        return this[key];
    }

    public addAll(properties): any {
        properties = objectToArray(properties);
        for (const property in properties) {
            if (properties.hasOwnProperty(property)) {
                this[property] = properties[property];
            }
        }
        this.postProcess();
    }

    public postProcess(): any {
        const variables = { ...this, ...process.env };
        for (const property in this) {
            if (this.hasOwnProperty(property)) {
                const value = this[property];
                const processedValue = this.processTemplate(value, variables);
                this[property] = processedValue;
            }
        }
    }

    private processTemplate(template, variables): any {
        // console.log(template);
        if (typeof template === 'string') {
            return template.replace(
                new RegExp('\\${[^{]+}', 'g'),
                name => variables[name.substring(2, name.length - 1)],
            );
        }
        return template;
    }
}

const yamlConfigPath = 'C:\\.config\\epinio\\config.yaml';
const yamlConfig = yaml.parseDocument(fs.readFileSync(yamlConfigPath, 'utf8'));
const config = new Config({... objectToArray(yamlConfig)});

export { config };

function objectToArray(source, currentKey?, target?): any {
    target = target || {};
    for (const property in source) {
        if (source.hasOwnProperty(property)) {
            const newKey = currentKey ? currentKey + '.' + property : property;
            const newVal = source[property];

            if (typeof newVal === 'object') {
                objectToArray(newVal, newKey, target);
            } else {
                target[newKey] = newVal;
            }
        }
    }
    return target;
}

function ipAddress(): any {
    const interfaces = require('os').networkInterfaces();
    for (const dev in interfaces) {
        if (interfaces.hasOwnProperty(dev)) {
            const iface = interfaces[dev];
            for (const alias of iface) {
                if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                    return alias.address;
                }
            }
        }
    }

    return null;
}