import type { ThemeManifest } from '../types/ThemeManifest';
export interface ValidationError {
    severity: 'fatal' | 'warning';
    file?: string;
    line?: number;
    block?: string;
    field?: string;
    message: string;
    suggestion?: string;
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
    summary: string;
}
export declare function validateTheme(manifest: ThemeManifest): ValidationResult;
//# sourceMappingURL=validateTheme.d.ts.map