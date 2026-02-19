import { EnhancementType } from '@/types';

export interface EnhancementOption {
    type: EnhancementType;
    label: string;
    icon: string;
    description: string;
    promptTemplate: string;
}

/**
 * Enhancement type presets — each maps to a prompt template sent to the AI model.
 * promptTemplate uses {{description}} as a placeholder for the user's optional instructions.
 */
export const ENHANCEMENT_TYPES: EnhancementOption[] = [
    {
        type: 'sky_replacement',
        label: 'Sky Replacement',
        icon: '🌅',
        description: 'Replace the sky with a beautiful blue sky or golden hour scene',
        promptTemplate:
            'Replace the sky in this real estate exterior photo with a beautiful, clear blue sky with a few wispy clouds. Maintain natural-looking lighting that matches the new sky. Keep all other elements identical. {{description}}',
    },
    {
        type: 'twilight',
        label: 'Twilight',
        icon: '🌆',
        description: 'Convert daytime exterior to a warm dusk scene',
        promptTemplate:
            'Transform this daytime real estate exterior photo into a warm, inviting twilight/dusk scene. Add warm interior lighting visible through windows, a deep blue-purple sky with hints of sunset, and ambient landscape lighting. {{description}}',
    },
    {
        type: 'hdr',
        label: 'HDR Enhancement',
        icon: '✨',
        description: 'Balance exposure and boost dynamic range',
        promptTemplate:
            'Enhance this real estate photo with HDR-quality processing. Balance the interior and exterior exposure so you can see through windows without blown highlights. Boost color vibrancy slightly, improve shadow detail, and make the space look bright and inviting. {{description}}',
    },
    {
        type: 'virtual_staging',
        label: 'Virtual Staging',
        icon: '🛋️',
        description: 'Furnish an empty room with realistic furniture',
        promptTemplate:
            'Virtually stage this empty room with modern, tasteful furniture and decor. Add a sofa, coffee table, area rug, side tables with lamps, and wall art. Use a warm, contemporary design style. Make the furniture look photorealistic and properly lit to match the room. {{description}}',
    },
    {
        type: 'declutter',
        label: 'Declutter',
        icon: '🧹',
        description: 'Remove personal items and clutter',
        promptTemplate:
            'Clean up this real estate photo by removing personal items, clutter, and distractions. Remove family photos, excess items on counters, toys, and personal belongings. Keep the space looking clean, spacious, and move-in ready. {{description}}',
    },
    {
        type: 'upscale',
        label: 'Upscale',
        icon: '🔍',
        description: 'Increase resolution and add fine detail like Midjourney upscale',
        promptTemplate:
            'Recreate this real estate photo at a higher resolution with significantly enhanced detail and clarity. Sharpen textures on surfaces like wood grain, fabric, tile, and stonework. Improve fine details on architectural elements, landscaping, and fixtures. Remove any compression artifacts or noise. The output should look like it was shot with a professional full-frame camera at maximum resolution. Maintain the exact same composition, colors, and lighting. {{description}}',
    },
    {
        type: 'custom',
        label: 'Custom',
        icon: '🎨',
        description: 'Describe exactly what you want changed',
        promptTemplate: '{{description}}',
    },
];

export function getEnhancementByType(type: EnhancementType): EnhancementOption | undefined {
    return ENHANCEMENT_TYPES.find(e => e.type === type);
}

export function buildPrompt(type: EnhancementType, userDescription?: string): string {
    const enhancement = getEnhancementByType(type);
    if (!enhancement) return userDescription || '';
    return enhancement.promptTemplate.replace(
        '{{description}}',
        userDescription || ''
    ).trim();
}

export type VaryStrength = 'subtle' | 'strong';

export function buildVaryPrompt(strength: VaryStrength): string {
    if (strength === 'subtle') {
        return (
            'Make very minor, subtle refinements to this real estate photo. ' +
            'Keep the image almost identical to the input. ' +
            'Slightly adjust lighting balance, color warmth, or micro-details ' +
            'to produce a small but noticeable improvement. ' +
            'Do not change the composition, perspective, or any major elements.'
        );
    }
    return (
        'Create a noticeably different creative variation of this real estate photo. ' +
        'You may adjust the color grading, lighting mood, contrast, and atmosphere significantly. ' +
        'Feel free to enhance or alter the sky, ambient lighting, or overall tone. ' +
        'Keep the same room/scene and composition but make the result feel distinctly different ' +
        'from the input while still looking professional and appealing for a real estate listing.'
    );
}
