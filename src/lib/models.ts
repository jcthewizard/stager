import { AIModel } from '@/types';

/**
 * Available AI models — verified against OpenRouter's catalog.
 * Only models that support image output (modalities: ["image"]) are listed.
 */
export const AI_MODELS: AIModel[] = [
    {
        id: 'google/gemini-2.5-flash-image',
        name: 'Gemini Flash Image',
        provider: 'Google',
        description: 'Lightning fast with excellent local edits. Great for quick batch processing.',
        badge: 'Fastest',
        creditsPerImage: 1,
        supportsEditing: true,
        speed: 'fast',
    },
    {
        id: 'openai/gpt-5-image',
        name: 'GPT-5 Image',
        provider: 'OpenAI',
        description: 'Superior instruction following. Handles complex enhancement requests with precision.',
        badge: 'Most Versatile',
        creditsPerImage: 3,
        supportsEditing: true,
        speed: 'medium',
    },
    {
        id: 'openai/gpt-5-image-mini',
        name: 'GPT-5 Image Mini',
        provider: 'OpenAI',
        description: 'Lightweight and affordable. Great for prototyping and quick edits.',
        badge: 'Budget Friendly',
        creditsPerImage: 1,
        supportsEditing: true,
        speed: 'fast',
    },
    {
        id: 'google/gemini-3-pro-image-preview',
        name: 'Gemini 3 Pro Image',
        provider: 'Google',
        description: 'Highest quality output with excellent detail preservation and scene understanding.',
        badge: 'Best Quality',
        creditsPerImage: 2,
        supportsEditing: true,
        speed: 'medium',
    },
];

export const DEFAULT_MODEL = AI_MODELS[0];

export function getModelById(id: string): AIModel | undefined {
    return AI_MODELS.find(m => m.id === id);
}
