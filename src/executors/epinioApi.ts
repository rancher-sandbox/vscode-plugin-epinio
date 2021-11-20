import axios, { AxiosInstance } from "axios";
import { Config } from "../config";

export class EpinioApi {

    private readonly config: Config;
    private readonly httpClient: AxiosInstance;

    constructor(
        config: Config
    ) {
        this.config = config;
        this.httpClient = axios.create({
            baseURL: this.config['api'],
            auth: {
                username: this.config['user'],
                password: this.config['pass']
            },
            validateStatus: (status) => status >=200 && status <= 299
        });
    }

    public printConfig() {
        const x = this.config.api;
    }
    
}