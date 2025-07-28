export class HeaderHandler {
    private readonly headers: Map<string, string>;

    constructor() {
        this.headers = new Map<string, string>();
    }

    public setHeaders(key: string, value: any): void {
        if (value !== undefined) {
            this.headers.set(key, String(value));
        }
    }

    public getHeaders(): { [key: string]: string } {
        return Object.fromEntries(this.headers);
    }

    public clearHeaders(): void {
        this.headers.clear();
    }
}