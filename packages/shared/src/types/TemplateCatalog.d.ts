export interface TemplateMeta {
    id: string;
    name: string;
    description: string;
    category: 'blog' | 'portfolio' | 'business' | 'creative';
}
export interface CopyStrings {
    heroHeading: string;
    heroSubheading: string;
    ctaHeading: string;
    ctaDescription: string;
    ctaButtonText: string;
    sectionHeading: string;
    aboutHeading: string;
    aboutDescription: string;
    notFoundMessage: string;
    copyright: string;
    featureItems: {
        title: string;
        description: string;
    }[];
}
export declare const TEMPLATE_CATALOG: TemplateMeta[];
//# sourceMappingURL=TemplateCatalog.d.ts.map