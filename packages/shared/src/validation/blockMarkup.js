import { coreBlocks } from '../constants/coreBlocks';
const BLOCK_OPEN = /<!--\s+wp:([a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)?)\s+(\{.*?\}\s+)?(\/?--\s*>)/g;
const BLOCK_CLOSE = /<!--\s+\/wp:([a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)?)\s+-->/g;
const FORBIDDEN_BLOCK = /<!--\s+wp:html[\s{/]/;
function getLineNumber(text, index) {
    let line = 1;
    for (let i = 0; i < index && i < text.length; i++) {
        if (text[i] === '\n')
            line++;
    }
    return line;
}
function checkForbiddenBlocks(markup, filename) {
    const errors = [];
    const lines = markup.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (FORBIDDEN_BLOCK.test(lines[i])) {
            errors.push({
                severity: 'fatal',
                file: filename,
                line: i + 1,
                block: 'wp:html',
                message: 'Custom HTML block is forbidden. Use core/group with layout styles instead.',
            });
        }
    }
    return errors;
}
function checkNesting(markup, filename) {
    const errors = [];
    const stack = [];
    // Collect all block tags in order
    const tags = [];
    let match;
    const openRe = new RegExp(BLOCK_OPEN.source, 'g');
    while ((match = openRe.exec(markup)) !== null) {
        const block = match[1];
        const isSelfClosing = match[3].startsWith('/');
        tags.push({
            type: isSelfClosing ? 'self-closing' : 'open',
            block,
            index: match.index,
        });
    }
    const closeRe = new RegExp(BLOCK_CLOSE.source, 'g');
    while ((match = closeRe.exec(markup)) !== null) {
        tags.push({ type: 'close', block: match[1], index: match.index });
    }
    tags.sort((a, b) => a.index - b.index);
    for (const tag of tags) {
        const line = getLineNumber(markup, tag.index);
        if (tag.type === 'self-closing')
            continue;
        if (tag.type === 'open') {
            stack.push({ block: tag.block, line });
        }
        else {
            if (stack.length === 0) {
                errors.push({
                    severity: 'fatal',
                    file: filename,
                    line,
                    block: `wp:${tag.block}`,
                    message: `Unexpected closing tag for wp:${tag.block} with no matching opening tag`,
                });
            }
            else if (stack[stack.length - 1].block !== tag.block) {
                const expected = stack[stack.length - 1];
                errors.push({
                    severity: 'fatal',
                    file: filename,
                    line,
                    block: `wp:${tag.block}`,
                    message: `Mismatched closing tag: expected wp:${expected.block} but found wp:${tag.block}`,
                });
                stack.pop();
            }
            else {
                stack.pop();
            }
        }
    }
    for (const unclosed of stack) {
        errors.push({
            severity: 'fatal',
            file: filename,
            line: unclosed.line,
            block: `wp:${unclosed.block}`,
            message: `Unclosed block wp:${unclosed.block}`,
        });
    }
    return errors;
}
function checkAllowlist(markup, filename) {
    const errors = [];
    const seen = new Set();
    const allowSet = new Set(coreBlocks);
    const openRe = new RegExp(BLOCK_OPEN.source, 'g');
    let match;
    while ((match = openRe.exec(markup)) !== null) {
        const block = match[1];
        const fullName = block.includes('/') ? block : `core/${block}`;
        if (!seen.has(fullName) && !allowSet.has(fullName)) {
            seen.add(fullName);
            errors.push({
                severity: 'warning',
                file: filename,
                line: getLineNumber(markup, match.index),
                block: fullName,
                message: `Unknown block "${fullName}" is not in the core allowlist`,
            });
        }
    }
    return errors;
}
export function validateQueryLoop(markup, filename) {
    const warnings = [];
    const queryRe = /<!--\s+wp:query[\s{]/g;
    let match;
    while ((match = queryRe.exec(markup)) !== null) {
        const line = getLineNumber(markup, match.index);
        const hasPostTemplate = /<!--\s+wp:post-template[\s{/]/.test(markup);
        const hasPostTitle = /<!--\s+wp:post-title[\s{/]/.test(markup);
        if (!hasPostTemplate) {
            warnings.push({
                severity: 'warning',
                file: filename,
                line,
                block: 'wp:query',
                message: 'Query block is missing wp:post-template child',
            });
        }
        if (!hasPostTitle) {
            warnings.push({
                severity: 'warning',
                file: filename,
                line,
                block: 'wp:query',
                message: 'Query block is missing wp:post-title in its template',
            });
        }
    }
    return warnings;
}
export function validateBlockMarkup(markup, filename) {
    if (!markup.trim())
        return [];
    const errors = [];
    errors.push(...checkForbiddenBlocks(markup, filename));
    errors.push(...checkNesting(markup, filename));
    errors.push(...checkAllowlist(markup, filename));
    return errors;
}
//# sourceMappingURL=blockMarkup.js.map