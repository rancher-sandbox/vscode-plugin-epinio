import axios, { AxiosInstance } from "axios";
import { ClusterConnectionConfig } from "../config";

export class EpinioApiExecutor {

    private config: ClusterConnectionConfig;
    private httpClient: AxiosInstance;

    constructor(
        configFile: string
    ) {
        this.setConfig(configFile);
    }

    public setConfig(configFile: string) {
        const https = require('https');
        this.config = new ClusterConnectionConfig(configFile);
        const httpsAgent = new https.Agent({
            rejectUnauthorized: false
        });
        axios.defaults.httpsAgent = httpsAgent;
        this.httpClient = axios.create({
            baseURL: this.config['api'],
            auth: {
                username: this.config['user'],
                password: this.config['pass']
            },
            validateStatus: (status) => status >=200 && status <= 299
        });
    }

    public async get(configFile: string, endPoint: string) {
        // this.setConfig(configFile);
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        return await this.httpClient.get(`${this.config.api}/api/v1/${endPoint}`);
    }

    public async post(configFile: string, endPoint: string, body) {
        // this.setConfig(configFile);
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        const ret =  await this.httpClient.post(`${this.config.api}/api/v1/${endPoint}`, body);
        return ret;
    }
    
}