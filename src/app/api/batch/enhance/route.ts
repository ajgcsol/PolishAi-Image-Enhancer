import { NextRequest, NextResponse } from 'next/server';

interface BatchItem {
  id: string;
  image: string;
  filename?: string;
  options?: {
    scale?: number;
    faceEnhance?: boolean;
    model?: string;
  };
}

interface BatchResult {
  id: string;
  filename?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  originalImage?: string;
  enhancedImage?: string;
  classification?: any;
  error?: string;
  processingTime?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { images, globalOptions = {} } = await request.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'Images array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (images.length > 1000) {
      return NextResponse.json(
        { error: 'Maximum 1000 images allowed per batch' },
        { status: 400 }
      );
    }

    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const results: BatchResult[] = [];

    // Initialize all items as pending
    for (const item of images) {
      results.push({
        id: item.id || `item_${Math.random().toString(36).substr(2, 9)}`,
        filename: item.filename,
        status: 'pending',
        originalImage: item.image
      });
    }

    // Process images in parallel batches to optimize performance for large batches
    const BATCH_SIZE = Math.min(5, Math.ceil(images.length / 10)); // Dynamic batch size
    const batches = [];
    
    for (let i = 0; i < images.length; i += BATCH_SIZE) {
      batches.push(images.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async (item: BatchItem, index: number) => {
        const resultIndex = images.findIndex(img => img.id === item.id);
        const result = results[resultIndex];
        
        try {
          result.status = 'processing';
          const startTime = Date.now();

          // Enhance the image
          const enhanceResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:8000'}/api/enhance`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: item.image,
              model: item.options?.model || globalOptions.model || 'nightmareai/real-esrgan',
              options: {
                ...globalOptions,
                ...item.options
              }
            })
          });

          if (!enhanceResponse.ok) {
            const errorData = await enhanceResponse.json();
            throw new Error(errorData.error || 'Enhancement failed');
          }

          const enhanceData = await enhanceResponse.json();
          result.enhancedImage = enhanceData.enhancedImage;

          // Classify the enhanced image (optional for large batches to save time)
          if (images.length <= 50) { // Only classify for smaller batches
            try {
              const classifyResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:8000'}/api/classify`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  image: enhanceData.enhancedImage,
                  originalImage: item.image,
                  enhancementDetails: {
                    model: enhanceData.model,
                    processingTime: enhanceData.processingTime
                  }
                })
              });

              if (classifyResponse.ok) {
                const classifyData = await classifyResponse.json();
                result.classification = classifyData.classification;
              }
            } catch (classifyError) {
              console.warn('Classification failed for item', result.id, classifyError);
              // Continue without classification
            }
          }

          result.status = 'completed';
          result.processingTime = Date.now() - startTime;

        } catch (error) {
          console.error('Error processing item', result.id, error);
          result.status = 'failed';
          result.error = error instanceof Error ? error.message : 'Unknown error';
        }
      });

      // Wait for current batch to complete before starting next batch
      await Promise.all(batchPromises);
      
      // Add a small delay between batches to avoid overwhelming the APIs
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Calculate summary statistics
    const completed = results.filter(r => r.status === 'completed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const totalProcessingTime = results.reduce((sum, r) => sum + (r.processingTime || 0), 0);

    return NextResponse.json({
      success: true,
      batchId,
      summary: {
        total: images.length,
        completed,
        failed,
        successRate: (completed / images.length) * 100,
        totalProcessingTime,
        averageProcessingTime: totalProcessingTime / images.length
      },
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error during batch processing' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Batch Image Enhancement API',
    usage: {
      method: 'POST',
      body: {
        images: [
          {
            id: 'unique identifier (optional)',
            image: 'base64 encoded image or image URL',
            filename: 'optional filename',
            options: {
              scale: 'upscaling factor (optional)',
              faceEnhance: 'boolean for face enhancement (optional)',
              model: 'model name (optional)'
            }
          }
        ],
        globalOptions: {
          scale: 'default scale for all images',
          faceEnhance: 'default face enhancement setting',
          model: 'default model for all images'
        }
      }
    },
    limits: {
      maxImages: 1000,
      maxFileSize: '10MB per image',
      supportedFormats: ['JPEG', 'PNG', 'WebP']
    },
    features: [
      'Sequential processing to avoid API rate limits',
      'Individual error handling per image',
      'Automatic quality classification',
      'Processing time tracking',
      'Batch summary statistics'
    ]
  });
}
