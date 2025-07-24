export class HeaderHandler {
    private headers: Map<string, string>;

    constructor() {
        this.headers = new Map<string, string>();
    }

    protected setHeaders(key: string, value: any): void {
        if (value !== undefined) {
            this.headers.set(key, String(value));
        }
    }

    protected getHeaders(): { [key: string]: string } {
        return Object.fromEntries(this.headers);
    }

    protected clearHeaders(): void {
        this.headers.clear();
    }
}