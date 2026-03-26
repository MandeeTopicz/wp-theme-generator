export interface BlockMarkupError {
    severity: 'fatal' | 'warning';
    file: string;
    line: number;
    block: string;
    message: string;
    suggestion?: string;
}
export declare function validateQueryLoop(markup: string, filename: string): BlockMarkupError[];
export declare function validateBlockMarkup(markup: string, filename: string): BlockMarkupError[];
//# sourceMappingURL=blockMarkup.d.ts.map