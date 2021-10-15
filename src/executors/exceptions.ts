export class EpinioExecutorError extends Error {
    constructor(public message: string, protected output: string) {
        super()
    }
}

export class EpinioCommandNotFound extends EpinioExecutorError {

}
