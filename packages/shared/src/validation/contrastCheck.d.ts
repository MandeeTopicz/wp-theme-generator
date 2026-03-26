import type { ColorPaletteEntry } from '../types/ThemeManifest';
import type { BlockMarkupError } from './blockMarkup';
export declare function getLuminance(hex: string): number;
export declare function getContrastRatio(hex1: string, hex2: string): number;
export declare function checkPaletteContrast(palette: ColorPaletteEntry[]): BlockMarkupError[];
//# sourceMappingURL=contrastCheck.d.ts.map