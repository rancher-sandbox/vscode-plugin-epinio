import yaml from 'js-yaml';
import * as fs from 'fs';

export class ClusterConnectionConfig {

    public api: string;
    public certs: string;
    public colors: string;
    public namespace: string;
    public org: string;
    public pass: string;
    public user: string;

    constructor(configFile: string) {
        this.addAll(configFile);
    }

    public get(key: string): any {
        return this[key];
    }

    public addAll(configFile: string): any {
        const yamlConfig = yaml.load(fs.readFileSync(configFile, 'utf8'));
        const properties = objectToArray(yamlConfig);
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