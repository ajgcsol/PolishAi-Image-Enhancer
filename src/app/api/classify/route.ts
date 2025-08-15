import { NextRequest, NextResponse } from 'next/server';

interface ClassificationResult {
  overall_quality: 'excellent' | 'good' | 'fair' | 'poor';
  brightness: 'too_bright' | 'too_dark' | 'optimal';
  sharpness: 'too_sharp' | 'too_blurry' | 'optimal';
  contrast: 'too_high' | 'too_low' | 'optimal';
  saturation: 'oversaturated' | 'undersaturated' | 'optimal';
  noise: 'high' | 'medium' | 'low';
  artifacts: 'present' | 'minimal' | 'none';
  resolution_quality: 'pixelated' | 'soft' | 'crisp';
  color_balance: 'warm_bias' | 'cool_bias' | 'neutral';
  recommendations: string[];
  confidence_score: number;
}

export async function POST(request: NextRequest) {
  try {
    const { image, originalImage, enhancementDetails } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Enhanced image data is required for classification' },
        { status: 400 }
      );
    }

    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterApiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    // Prepare the analysis prompt
    const analysisPrompt = `
You are an expert image quality analyst. Analyze the provided enhanced image and classify its quality across multiple dimensions.

${originalImage ? 'You have both the original and enhanced images for comparison.' : 'You have the enhanced image only.'}

${enhancementDetails ? `Enhancement details: ${JSON.stringify(enhancementDetails)}` : ''}

Please analyze the image and provide a detailed quality assessment in the following JSON format:

{
  "overall_quality": "excellent|good|fair|poor",
  "brightness": "too_bright|too_dark|optimal",
  "sharpness": "too_sharp|too_blurry|optimal", 
  "contrast": "too_high|too_low|optimal",
  "saturation": "oversaturated|undersaturated|optimal",
  "noise": "high|medium|low",
  "artifacts": "present|minimal|none",
  "resolution_quality": "pixelated|soft|crisp",
  "color_balance": "warm_bias|cool_bias|neutral",
  "recommendations": ["specific actionable recommendations"],
  "confidence_score": 0.95
}

Focus on technical image quality aspects and provide specific, actionable recommendations for improvement.
`;

    // Prepare the message content
    const messageContent: any[] = [
      { type: 'text', text: analysisPrompt }
    ];

    // Add the enhanced image
    if (image.startsWith('http')) {
      messageContent.push({
        type: 'image_url',
        image_url: { url: image }
      });
    } else {
      messageContent.push({
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${image}` }
      });
    }

    // Add original image for comparison if available
    if (originalImage) {
      messageContent.push({
        type: 'text',
        text: 'Original image for comparison:'
      });
      
      if (originalImage.startsWith('http')) {
        messageContent.push({
          type: 'image_url',
          image_url: { url: originalImage }
        });
      } else {
        messageContent.push({
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${originalImage}` }
        });
      }
    }

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Advanced Image Enhancement App'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: messageContent
          }
        ],
        max_tokens: 1000,
        temperature: 0.1 // Low temperature for consistent analysis
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to analyze image quality' },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      return NextResponse.json(
        { error: 'Invalid response from classification service' },
        { status: 500 }
      );
    }

    const analysisText = result.choices[0].message.content;
    
    // Try to parse JSON from the response
    let classification: ClassificationResult;
    try {
      // Extract JSON from the response (it might be wrapped in markdown)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        classification = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse classification result:', parseError);
      
      // Fallback: create a basic classification from text analysis
      classification = createFallbackClassification(analysisText);
    }

    // Validate and sanitize the classification result
    const validatedClassification = validateClassification(classification);

    return NextResponse.json({
      success: true,
      classification: validatedClassification,
      rawAnalysis: analysisText,
      processingTime: Date.now(),
      model: 'anthropic/claude-3.5-sonnet'
    });

  } catch (error) {
    console.error('Classification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during image classification' },
      { status: 500 }
    );
  }
}

function createFallbackClassification(analysisText: string): ClassificationResult {
  // Create a basic classification based on text analysis
  const text = analysisText.toLowerCase();
  
  return {
    overall_quality: text.includes('excellent') ? 'excellent' : 
                    text.includes('good') ? 'good' : 
                    text.includes('poor') ? 'poor' : 'fair',
    brightness: text.includes('too bright') || text.includes('overexposed') ? 'too_bright' :
               text.includes('too dark') || text.includes('underexposed') ? 'too_dark' : 'optimal',
    sharpness: text.includes('too sharp') ? 'too_sharp' :
              text.includes('blurry') || text.includes('blur') ? 'too_blurry' : 'optimal',
    contrast: text.includes('high contrast') ? 'too_high' :
             text.includes('low contrast') ? 'too_low' : 'optimal',
    saturation: text.includes('oversaturated') ? 'oversaturated' :
               text.includes('undersaturated') ? 'undersaturated' : 'optimal',
    noise: text.includes('noisy') || text.includes('grain') ? 'high' : 'low',
    artifacts: text.includes('artifact') ? 'present' : 'minimal',
    resolution_quality: text.includes('pixelated') ? 'pixelated' :
                       text.includes('soft') ? 'soft' : 'crisp',
    color_balance: text.includes('warm') ? 'warm_bias' :
                  text.includes('cool') ? 'cool_bias' : 'neutral',
    recommendations: ['Review the detailed analysis for specific recommendations'],
    confidence_score: 0.7
  };
}

function validateClassification(classification: any): ClassificationResult {
  // Ensure all required fields are present with valid values
  const validQualities = ['excellent', 'good', 'fair', 'poor'];
  const validBrightness = ['too_bright', 'too_dark', 'optimal'];
  const validSharpness = ['too_sharp', 'too_blurry', 'optimal'];
  const validContrast = ['too_high', 'too_low', 'optimal'];
  const validSaturation = ['oversaturated', 'undersaturated', 'optimal'];
  const validNoise = ['high', 'medium', 'low'];
  const validArtifacts = ['present', 'minimal', 'none'];
  const validResolution = ['pixelated', 'soft', 'crisp'];
  const validColorBalance = ['warm_bias', 'cool_bias', 'neutral'];

  return {
    overall_quality: validQualities.includes(classification.overall_quality) ? 
      classification.overall_quality : 'fair',
    brightness: validBrightness.includes(classification.brightness) ? 
      classification.brightness : 'optimal',
    sharpness: validSharpness.includes(classification.sharpness) ? 
      classification.sharpness : 'optimal',
    contrast: validContrast.includes(classification.contrast) ? 
      classification.contrast : 'optimal',
    saturation: validSaturation.includes(classification.saturation) ? 
      classification.saturation : 'optimal',
    noise: validNoise.includes(classification.noise) ? 
      classification.noise : 'low',
    artifacts: validArtifacts.includes(classification.artifacts) ? 
      classification.artifacts : 'minimal',
    resolution_quality: validResolution.includes(classification.resolution_quality) ? 
      classification.resolution_quality : 'crisp',
    color_balance: validColorBalance.includes(classification.color_balance) ? 
      classification.color_balance : 'neutral',
    recommendations: Array.isArray(classification.recommendations) ? 
      classification.recommendations : ['No specific recommendations available'],
    confidence_score: typeof classification.confidence_score === 'number' ? 
      Math.max(0, Math.min(1, classification.confidence_score)) : 0.8
  };
}

export async function GET() {
  return NextResponse.json({
    message: 'Image Quality Classification API',
    usage: {
      method: 'POST',
      body: {
        image: 'enhanced image (base64 or URL)',
        originalImage: 'optional original image for comparison',
        enhancementDetails: 'optional details about the enhancement process'
      }
    },
    classificationCategories: {
      overall_quality: ['excellent', 'good', 'fair', 'poor'],
      brightness: ['too_bright', 'too_dark', 'optimal'],
      sharpness: ['too_sharp', 'too_blurry', 'optimal'],
      contrast: ['too_high', 'too_low', 'optimal'],
      saturation: ['oversaturated', 'undersaturated', 'optimal'],
      noise: ['high', 'medium', 'low'],
      artifacts: ['present', 'minimal', 'none'],
      resolution_quality: ['pixelated', 'soft', 'crisp'],
      color_balance: ['warm_bias', 'cool_bias', 'neutral']
    }
  });
}
