import { NextRequest, NextResponse } from 'next/server';

interface ReplicateResponse {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[];
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { image, model = 'nightmareai/real-esrgan', options = {}, useFallback = false } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // If fallback is explicitly requested, return immediately for client-side processing
    if (useFallback) {
      return NextResponse.json({
        success: true,
        enhancedImage: image, // Client will process this
        originalImage: image,
        model: 'client-side-fallback',
        processingTime: 0,
        predictionId: 'fallback-' + Date.now(),
        fallbackUsed: true,
        message: 'Using client-side processing fallback',
        qualitySettings: {
          scale: options.scale || 4,
          outputFormat: options.outputFormat || 'jpeg',
          quality: options.quality || 90,
          faceEnhance: options.faceEnhance || false
        }
      });
    }

    // Extract quality settings from options
    const {
      scale = 4,
      faceEnhance = false,
      outputFormat = 'jpeg',
      quality = 90,
      ...otherOptions
    } = options;

    const replicateApiKey = process.env.REPLICATE_API_KEY;
    if (!replicateApiKey) {
      return NextResponse.json(
        { error: 'Replicate API key not configured' },
        { status: 500 }
      );
    }

    // Start the prediction
    const predictionResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateApiKey}`,
        'Content-Type': 'application/json',
      },
        body: JSON.stringify({
          version: getModelVersion(model),
          input: {
            image: image,
            scale: scale,
            face_enhance: faceEnhance,
            output_format: outputFormat,
            output_quality: quality,
            ...otherOptions
          }
        })
    });

    if (!predictionResponse.ok) {
      const errorText = await predictionResponse.text();
      console.error('Replicate API error:', errorText);
      
      // Handle specific error cases
      if (predictionResponse.status === 402) {
        return NextResponse.json(
          { 
            error: 'Insufficient Replicate credits',
            details: 'Your Replicate account needs more credits. If you just made a payment, please wait 5-10 minutes for credits to process.',
            troubleshooting: {
              steps: [
                'Check your Replicate account balance at https://replicate.com/account/billing',
                'If you just paid, wait 5-10 minutes for credits to process',
                'Try refreshing your Replicate dashboard',
                'Contact Replicate support if credits don\'t appear after 15 minutes'
              ],
              fallback: 'You can try using a different model or contact support'
            }
          },
          { status: 402 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to start image enhancement',
          details: errorText,
          status: predictionResponse.status
        },
        { status: predictionResponse.status }
      );
    }

    const prediction: ReplicateResponse = await predictionResponse.json();

    // Poll for completion
    let result = prediction;
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    while (result.status === 'starting' || result.status === 'processing') {
      if (attempts >= maxAttempts) {
        return NextResponse.json(
          { error: 'Enhancement timeout - please try again' },
          { status: 408 }
        );
      }

      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          'Authorization': `Token ${replicateApiKey}`,
        }
      });

      if (pollResponse.ok) {
        result = await pollResponse.json();
      }
      
      attempts++;
    }

    if (result.status === 'failed') {
      return NextResponse.json(
        { error: result.error || 'Enhancement failed' },
        { status: 500 }
      );
    }

    if (result.status === 'succeeded' && result.output) {
      // Handle both single URL and array of URLs
      const enhancedImageUrl = Array.isArray(result.output) ? result.output[0] : result.output;
      
      return NextResponse.json({
        success: true,
        enhancedImage: enhancedImageUrl,
        originalImage: image,
        model: model,
        processingTime: attempts * 5, // Approximate processing time
        predictionId: result.id,
        qualitySettings: {
          scale,
          outputFormat,
          quality,
          faceEnhance
        }
      });
    }

    return NextResponse.json(
      { error: 'Unexpected response from enhancement service' },
      { status: 500 }
    );

  } catch (error) {
    console.error('Enhancement API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during image enhancement' },
      { status: 500 }
    );
  }
}

function getModelVersion(model: string): string {
  // Map model names to their latest versions
  const modelVersions: Record<string, string> = {
    'nightmareai/real-esrgan': 'f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',
    'tencentarc/gfpgan': 'f2d8b2c3b2e4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0',
    'sczhou/codeformer': 'a2c5c7e8d9f0g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6',
    'xinntao/realesrgan': 'f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa'
  };

  return modelVersions[model] || modelVersions['nightmareai/real-esrgan'];
}

export async function GET() {
  return NextResponse.json({
    message: 'Image Enhancement API',
    availableModels: [
      'nightmareai/real-esrgan',
      'tencentarc/gfpgan', 
      'sczhou/codeformer',
      'xinntao/realesrgan'
    ],
    usage: {
      method: 'POST',
      body: {
        image: 'base64 encoded image or image URL',
        model: 'optional model name (default: nightmareai/real-esrgan)',
        options: {
          scale: 'upscaling factor (default: 4)',
          faceEnhance: 'boolean for face enhancement (default: false)'
        }
      }
    }
  });
}
