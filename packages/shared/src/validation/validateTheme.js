import { requiredFiles } from '../constants/requiredFiles';
import { validateThemeSlug } from './themeSlug';
import { validateThemeJson } from './themeJson';
import { validateBlockMarkup } from './blockMarkup';
import { validateQueryLoop } from './blockMarkup';
import { checkPaletteContrast } from './contrastCheck';
export function validateTheme(manifest) {
    const errors = [];
    const warnings = [];
    // Theme slug
    const slugResult = validateThemeSlug(manifest.slug);
    if (!slugResult.valid) {
        errors.push({
            severity: 'fatal',
            field: 'slug',
            message: `Invalid theme slug "${manifest.slug}"`,
            suggestion: slugResult.suggestion,
        });
    }
    // theme.json
    const jsonResult = validateThemeJson(manifest.themeJson);
    if (!jsonResult.valid) {
        for (const err of jsonResult.errors) {
            errors.push({
                severity: 'fatal',
                file: 'theme.json',
                field: err.path,
                message: err.message,
            });
        }
    }
    // Template markup
    for (const tpl of manifest.templates) {
        const markupErrors = validateBlockMarkup(tpl.content, `templates/${tpl.name}`);
        for (const err of markupErrors) {
            if (err.severity === 'fatal') {
                errors.push(err);
            }
            else {
                warnings.push(err);
            }
        }
    }
    // Template part markup
    for (const part of manifest.templateParts) {
        const markupErrors = validateBlockMarkup(part.content, `parts/${part.name}`);
        for (const err of markupErrors) {
            if (err.severity === 'fatal') {
                errors.push(err);
            }
            else {
                warnings.push(err);
            }
        }
    }
    // Pattern markup
    for (const pattern of manifest.patterns) {
        const markupErrors = validateBlockMarkup(pattern.content, `patterns/${pattern.name}`);
        for (const err of markupErrors) {
            if (err.severity === 'fatal') {
                errors.push(err);
            }
            else {
                warnings.push(err);
            }
        }
    }
    // Query loop quality
    for (const tpl of manifest.templates) {
        warnings.push(...validateQueryLoop(tpl.content, `templates/${tpl.name}`));
    }
    for (const pattern of manifest.patterns) {
        warnings.push(...validateQueryLoop(pattern.content, `patterns/${pattern.name}`));
    }
    // Palette contrast
    if (manifest.colors) {
        warnings.push(...checkPaletteContrast(manifest.colors));
    }
    // Required files — normalize paths for comparison
    // The AI may return template names with or without .html extension
    function normalizePath(p) {
        const stripped = p.replace(/^\//, '');
        // Normalize template/part paths: "templates/index" → "templates/index.html"
        if (stripped.startsWith('templates/') && !stripped.endsWith('.html')) {
            return stripped + '.html';
        }
        if (stripped.startsWith('parts/') && !stripped.endsWith('.html')) {
            return stripped + '.html';
        }
        if (stripped.startsWith('patterns/') && !stripped.endsWith('.php')) {
            return stripped + '.php';
        }
        return stripped;
    }
    const normalizedFiles = new Set(manifest.files.map(normalizePath));
    for (const required of requiredFiles) {
        if (!normalizedFiles.has(normalizePath(required))) {
            errors.push({
                severity: 'fatal',
                file: required,
                message: `Required file "${required}" is missing`,
            });
        }
    }
    const isValid = errors.length === 0;
    let summary;
    if (errors.length === 0 && warnings.length === 0) {
        summary = 'All checks passed';
    }
    else {
        const parts = [];
        if (errors.length > 0) {
            parts.push(`${errors.length} error${errors.length !== 1 ? 's' : ''}`);
        }
        if (warnings.length > 0) {
            parts.push(`${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`);
        }
        summary = parts.join(', ');
    }
    return { isValid, errors, warnings, summary };
}
//# sourceMappingURL=validateTheme.js.map