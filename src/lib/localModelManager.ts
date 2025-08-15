import fs from 'fs/promises';
import path from 'path';

export interface ModelInfo {
  name: string;
  type: 'enhancement' | 'super-resolution' | 'deblurring' | 'custom';
  version: string;
  size: number;
  path: string;
  description?: string;
  performance?: {
    speed: number;
    quality: number;
  };
}

export class LocalModelManager {
  private modelsDir: string;

  constructor(modelsDir: string = './models') {
    this.modelsDir = modelsDir;
  }

  /**
   * Load all available local models
   */
  async loadLocalModels(): Promise<ModelInfo[]> {
    try {
      const models: ModelInfo[] = [];
      const categories = ['enhancement', 'super-resolution', 'deblurring', 'custom'];

      for (const category of categories) {
        const categoryPath = path.join(this.modelsDir, category);
        
        try {
          await fs.access(categoryPath);
          const files = await fs.readdir(categoryPath);
          
          for (const file of files) {
            if (file.endsWith('.json')) continue; // Skip metadata files
            
            const filePath = path.join(categoryPath, file);
            const stats = await fs.stat(filePath);
            
            // Try to load metadata if exists
            const metadataPath = path.join(categoryPath, `${file}.json`);
            let metadata = {};
            
            try {
              const metadataContent = await fs.readFile(metadataPath, 'utf-8');
              metadata = JSON.parse(metadataContent);
            } catch {
              // No metadata file, use defaults
            }

            models.push({
              name: file,
              type: category as ModelInfo['type'],
              version: (metadata as any).version || '1.0.0',
              size: stats.size,
              path: filePath,
              description: (metadata as any).description,
              performance: (metadata as any).performance,
            });
          }
        } catch {
          // Category directory doesn't exist, skip
        }
      }

      return models;
    } catch (error) {
      console.error('Error loading local models:', error);
      return [];
    }
  }

  /**
   * Download a model from a URL and store it locally
   */
  async downloadModel(
    url: string, 
    modelName: string, 
    type: ModelInfo['type'],
    metadata?: Partial<ModelInfo>
  ): Promise<boolean> {
    try {
      const categoryPath = path.join(this.modelsDir, type);
      await fs.mkdir(categoryPath, { recursive: true });

      const modelPath = path.join(categoryPath, modelName);
      
      // Download the model (simplified - in production, use proper streaming)
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download model: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      await fs.writeFile(modelPath, Buffer.from(buffer));

      // Save metadata if provided
      if (metadata) {
        const metadataPath = path.join(categoryPath, `${modelName}.json`);
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      }

      console.log(`Model ${modelName} downloaded successfully to ${modelPath}`);
      return true;
    } catch (error) {
      console.error('Error downloading model:', error);
      return false;
    }
  }

  /**
   * Get model information by name and type
   */
  async getModelInfo(modelName: string, type: ModelInfo['type']): Promise<ModelInfo | null> {
    const models = await this.loadLocalModels();
    return models.find(model => model.name === modelName && model.type === type) || null;
  }

  /**
   * Check if a model exists locally
   */
  async modelExists(modelName: string, type: ModelInfo['type']): Promise<boolean> {
    const modelPath = path.join(this.modelsDir, type, modelName);
    try {
      await fs.access(modelPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete a local model
   */
  async deleteModel(modelName: string, type: ModelInfo['type']): Promise<boolean> {
    try {
      const modelPath = path.join(this.modelsDir, type, modelName);
      const metadataPath = path.join(this.modelsDir, type, `${modelName}.json`);

      await fs.unlink(modelPath);
      
      // Try to delete metadata file if it exists
      try {
        await fs.unlink(metadataPath);
      } catch {
        // Metadata file doesn't exist, ignore
      }

      console.log(`Model ${modelName} deleted successfully`);
      return true;
    } catch (error) {
      console.error('Error deleting model:', error);
      return false;
    }
  }

  /**
   * Get total storage used by models
   */
  async getStorageUsage(): Promise<{ totalSize: number; modelCount: number }> {
    const models = await this.loadLocalModels();
    const totalSize = models.reduce((sum, model) => sum + model.size, 0);
    return { totalSize, modelCount: models.length };
  }

  /**
   * Clean up cache directory
   */
  async cleanCache(): Promise<void> {
    try {
      const cachePath = path.join(this.modelsDir, 'cache');
      await fs.rm(cachePath, { recursive: true, force: true });
      await fs.mkdir(cachePath, { recursive: true });
      console.log('Cache cleaned successfully');
    } catch (error) {
      console.error('Error cleaning cache:', error);
    }
  }
}

// Export singleton instance
export const modelManager = new LocalModelManager();
