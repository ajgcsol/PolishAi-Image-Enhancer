# Local AI Models Storage

This directory is designed to store AI models locally for the Advanced Image Enhancement application.

## Purpose

- **Local Model Storage**: Store pre-trained models for offline image enhancement
- **Custom Model Integration**: Future location for sophisticated custom models
- **Batch Processing**: Enable faster batch processing by avoiding repeated API calls
- **Model Caching**: Cache frequently used models for improved performance

## Supported Model Types

- **Image Enhancement Models**: Real-ESRGAN, GFPGAN, CodeFormer variants
- **Super Resolution Models**: ESRGAN, SRCNN, EDSR
- **Deblurring Models**: DeblurGAN, MPRNet
- **Custom Models**: User-trained models in compatible formats

## Directory Structure

```
models/
├── README.md                 # This file
├── enhancement/              # Image enhancement models
├── super-resolution/         # Super resolution models
├── deblurring/              # Deblurring specific models
├── custom/                  # User custom models
└── cache/                   # Temporary model cache
```

## Model Management

Models can be managed through:
1. **Web Interface**: Upload and manage models via the web app
2. **CLI Tool**: Use the CLI installer to download and organize models
3. **API Endpoints**: Programmatic model management
4. **Manual**: Direct file placement in appropriate directories

## Future Enhancements

- **Model Versioning**: Track model versions and performance metrics
- **Automatic Updates**: Download latest model versions
- **Performance Benchmarking**: Compare model performance on test datasets
- **Custom Model Training**: Integration with training pipelines

## Security Notes

- Models are stored locally and not transmitted to external services
- Ensure models are from trusted sources
- Regular cleanup of cache directory recommended
