const EPINIO_OUTPUT_COLUMN_SEPARATOR = '|';

type Dictionary<T> = {
    [key: string]: T
};

module Dictionary {
    export function of<T>(): Dictionary<T> {
        return {};
    }
}

function getHeaderLineIndex(tableLines: string[]) {
    for(let i=0;i<tableLines.length;i++) {
        if(tableLines[i].split(EPINIO_OUTPUT_COLUMN_SEPARATOR).length > 1)
            return(i);
    }
    return(-1);
}

function parseLine(line: string, columnHeaders: string[]) {
    const lineInfoObject = Dictionary.of<string>();
    const bits = line.split(EPINIO_OUTPUT_COLUMN_SEPARATOR);
    bits.forEach((columnValue, index) => {
        lineInfoObject[columnHeaders[index].trim()] = columnValue.trim();
    });
    return lineInfoObject;
}

export function parseTableLines(tableLines: string[]): Dictionary<string>[] {
    if (!tableLines || tableLines.length === 0 ) {
        return [];
    }
    const headerLineIndex = getHeaderLineIndex(tableLines);
    if(headerLineIndex === -1) 
        return [];
    const columnHeaders = tableLines[headerLineIndex].toLowerCase().split(EPINIO_OUTPUT_COLUMN_SEPARATOR);
    return tableLines.filter((item,index) => index > headerLineIndex+1)
                     .map((line) => parseLine(line, columnHeaders));
}

export function isApplicationHealthy(application:any): boolean {
    if(application.status.toLowerCase().includes('inactive')) {
        return false;
    } else {
        const applicationStatus:string[] = application.status.split('/');
        if(applicationStatus && applicationStatus.length === 2) {
            const [runningInstances, totalInstances] = applicationStatus;
            if(Number(totalInstances) > 0 && Number(runningInstances) >= 1) 
                return true;
            else
                return false;
        } else {
            return false;
        }
    }
}

export function getNamespace(appInfo: any[]): string {
    return appInfo.find(line => line.includes('Namespace'))
           .split(':')
           .pop()
           .trim();
}
