import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * POST /api/enhance
 *
 * Body: {
 *   imageUrl: string,        // public URL of the uploaded original image
 *   modelId: string,         // OpenRouter model ID (e.g. "openai/gpt-5-image")
 *   prompt: string,          // Enhancement prompt
 *   enhancementType: string, // e.g. "hdr", "twilight"
 *   creditsToDeduct: number, // credits to subtract
 * }
 *
 * Returns: { enhancedUrls: string[] }
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verify the user is authenticated
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { imageUrl, modelId, prompt, enhancementType, creditsToDeduct } = body;

        if (!imageUrl || !modelId || !prompt) {
            return NextResponse.json(
                { error: 'Missing required fields: imageUrl, modelId, prompt' },
                { status: 400 }
            );
        }

        // Check credits
        const { data: profile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single();

        if (!profile || profile.credits < (creditsToDeduct || 1)) {
            return NextResponse.json(
                { error: 'Insufficient credits. Please purchase more credits to continue.' },
                { status: 402 }
            );
        }

        // Call OpenRouter API
        const openRouterResponse = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://stager.app',
                'X-Title': 'Stager',
            },
            body: JSON.stringify({
                model: modelId,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: prompt,
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: imageUrl,
                                },
                            },
                        ],
                    },
                ],
                // Required: tell OpenRouter we want image output
                modalities: ['image'],
            }),
        });

        if (!openRouterResponse.ok) {
            const errBody = await openRouterResponse.text();
            console.error('OpenRouter error:', openRouterResponse.status, errBody);
            return NextResponse.json(
                { error: `AI enhancement failed: ${openRouterResponse.statusText}` },
                { status: 502 }
            );
        }

        const openRouterData = await openRouterResponse.json();
        console.log('OpenRouter response keys:', JSON.stringify(Object.keys(openRouterData)));

        // Extract image URLs from the response
        // OpenRouter returns images as base64 data URLs in the content array
        const enhancedUrls: string[] = [];
        const choice = openRouterData.choices?.[0];

        if (choice?.message?.content) {
            // If content is a string — may be base64 or text
            if (typeof choice.message.content === 'string') {
                if (choice.message.content.startsWith('data:image') || choice.message.content.startsWith('http')) {
                    enhancedUrls.push(choice.message.content);
                }
            }
            // If content is an array of parts (most common for image models)
            if (Array.isArray(choice.message.content)) {
                for (const part of choice.message.content) {
                    if (part.type === 'image_url' && part.image_url?.url) {
                        enhancedUrls.push(part.image_url.url);
                    }
                    if (part.type === 'image' && (part.url || part.image_url?.url)) {
                        enhancedUrls.push(part.url || part.image_url.url);
                    }
                }
            }
        }

        // Also check message.images array (OpenRouter's primary image output format)
        // Format: [{type: "image_url", image_url: {url: "data:image/png;base64,..."}}]
        if (choice?.message?.images && Array.isArray(choice.message.images)) {
            for (const img of choice.message.images) {
                if (typeof img === 'string') {
                    enhancedUrls.push(img);
                } else if (img?.image_url?.url) {
                    enhancedUrls.push(img.image_url.url);
                } else if (img?.url) {
                    enhancedUrls.push(img.url);
                }
            }
        }

        if (enhancedUrls.length === 0) {
            console.error('No image in OpenRouter response:', JSON.stringify(openRouterData).slice(0, 1000));
            return NextResponse.json(
                { error: 'No enhanced image was generated. Please try again.' },
                { status: 500 }
            );
        }

        // Deduct credits
        const newCredits = Math.max(0, profile.credits - (creditsToDeduct || 1));
        await supabase
            .from('profiles')
            .update({ credits: newCredits, updated_at: new Date().toISOString() })
            .eq('id', user.id);

        // Log the credit transaction
        await supabase.from('credit_transactions').insert({
            user_id: user.id,
            amount: -(creditsToDeduct || 1),
            type: 'enhancement',
            description: `${enhancementType} enhancement using ${modelId}`,
        });

        // Save enhancement record
        await supabase.from('enhancements').insert({
            user_id: user.id,
            original_url: imageUrl,
            enhanced_urls: enhancedUrls,
            model_used: modelId,
            enhancement_type: enhancementType,
            credits_used: creditsToDeduct || 1,
            status: 'completed',
            prompt: prompt,
        });

        return NextResponse.json({ enhancedUrls });
    } catch (err) {
        console.error('Enhancement error:', err);
        return NextResponse.json(
            { error: 'An unexpected error occurred. Please try again.' },
            { status: 500 }
        );
    }
}
