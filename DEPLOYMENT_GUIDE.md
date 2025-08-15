# Deployment Guide: Advanced Image Enhancement Application

## Quick Start

### Local Development
```bash
# 1. Clone and install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# 3. Start development server
npm run dev
# Visit http://localhost:8000
```

### Docker Deployment
```bash
# 1. Build and run with Docker Compose
docker-compose up -d

# 2. Check status
docker-compose ps

# 3. View logs
docker-compose logs -f image-enhancer
```

## Environment Variables

### Required Variables
```bash
REPLICATE_API_KEY=your_replicate_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### Optional Variables
```bash
ADMIN_KEY=your-secure-admin-key
NODE_ENV=production
PORT=8000
NEXT_TELEMETRY_DISABLED=1
```

## Administrative Commands

### Using curl
```bash
# System Status
curl -X POST http://localhost:8000/api/admin \
  -H "Content-Type: application/json" \
  -d '{"command": "status", "adminKey": "dev-admin-key"}'

# Health Check
curl -X POST http://localhost:8000/api/admin \
  -H "Content-Type: application/json" \
  -d '{"command": "health", "adminKey": "dev-admin-key"}'

# Get Logs
curl -X POST http://localhost:8000/api/admin \
  -H "Content-Type: application/json" \
  -d '{"command": "logs", "args": {"level": "info", "limit": 50}, "adminKey": "dev-admin-key"}'

# Get Metrics
curl -X POST http://localhost:8000/api/admin \
  -H "Content-Type: application/json" \
  -d '{"command": "metrics", "args": {"timeRange": "24h"}, "adminKey": "dev-admin-key"}'

# Test APIs
curl -X POST http://localhost:8000/api/admin \
  -H "Content-Type: application/json" \
  -d '{"command": "test-apis", "adminKey": "dev-admin-key"}'

# Clear Cache
curl -X POST http://localhost:8000/api/admin \
  -H "Content-Type: application/json" \
  -d '{"command": "clear-cache", "adminKey": "dev-admin-key"}'

# Debug Image Processing
curl -X POST http://localhost:8000/api/admin \
  -H "Content-Type: application/json" \
  -d '{"command": "debug-image", "args": {"imageId": "12345", "includeMetadata": true}, "adminKey": "dev-admin-key"}'

# System Information
curl -X POST http://localhost:8000/api/admin \
  -H "Content-Type: application/json" \
  -d '{"command": "system-info", "adminKey": "dev-admin-key"}'
```

### Using Python SDK
```bash
# Install Python SDK
cd python-sdk
pip install -r requirements.txt

# Basic usage
python image_enhancer_sdk.py enhance input.jpg output.jpg
python image_enhancer_sdk.py batch ./input_images ./output_images
python image_enhancer_sdk.py status
python image_enhancer_sdk.py health
python image_enhancer_sdk.py metrics --time-range 24h
```

## Troubleshooting Commands

### Check API Connectivity
```bash
# Test Replicate API
curl -H "Authorization: Token $REPLICATE_API_KEY" \
  https://api.replicate.com/v1/models

# Test OpenRouter API  
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  https://openrouter.ai/api/v1/models
```

### Debug Image Processing
```bash
# Test single image enhancement
curl -X POST http://localhost:8000/api/enhance \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...", "model": "nightmareai/real-esrgan"}'

# Test image classification
curl -X POST http://localhost:8000/api/classify \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."}'
```

### Monitor System Resources
```bash
# Docker container stats
docker stats image-enhancer

# Check disk usage
docker system df

# View container logs
docker logs -f image-enhancer_image-enhancer_1
```

## Production Deployment

### Cloud Deployment (AWS/GCP/Azure)

#### Using Docker
```bash
# 1. Build production image
docker build -t image-enhancer:latest .

# 2. Tag for registry
docker tag image-enhancer:latest your-registry/image-enhancer:latest

# 3. Push to registry
docker push your-registry/image-enhancer:latest

# 4. Deploy to cloud service
# (Use your cloud provider's container service)
```

#### Environment Setup
```bash
# Production environment variables
export REPLICATE_API_KEY="your-production-key"
export OPENROUTER_API_KEY="your-production-key"
export ADMIN_KEY="secure-random-key"
export NODE_ENV="production"
```

### Kubernetes Deployment
```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: image-enhancer
spec:
  replicas: 3
  selector:
    matchLabels:
      app: image-enhancer
  template:
    metadata:
      labels:
        app: image-enhancer
    spec:
      containers:
      - name: image-enhancer
        image: your-registry/image-enhancer:latest
        ports:
        - containerPort: 8000
        env:
        - name: REPLICATE_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: replicate-key
        - name: OPENROUTER_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: openrouter-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: image-enhancer-service
spec:
  selector:
    app: image-enhancer
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

## Monitoring and Alerting

### Health Check Endpoints
```bash
# Application health
curl http://localhost:8000/api/admin

# Detailed health check
curl -X POST http://localhost:8000/api/admin \
  -H "Content-Type: application/json" \
  -d '{"command": "health", "adminKey": "dev-admin-key"}'
```

### Log Monitoring
```bash
# Real-time logs
docker-compose logs -f image-enhancer

# Specific log levels
curl -X POST http://localhost:8000/api/admin \
  -H "Content-Type: application/json" \
  -d '{"command": "logs", "args": {"level": "error", "limit": 100}, "adminKey": "dev-admin-key"}'
```

### Performance Metrics
```bash
# Get system metrics
curl -X POST http://localhost:8000/api/admin \
  -H "Content-Type: application/json" \
  -d '{"command": "metrics", "adminKey": "dev-admin-key"}' | jq '.'
```

## Backup and Recovery

### Data Backup
```bash
# Backup models directory
docker cp image-enhancer_image-enhancer_1:/app/models ./backup/models

# Backup training data
curl -X POST http://localhost:8000/api/admin \
  -H "Content-Type: application/json" \
  -d '{"command": "export-data", "args": {"type": "training", "format": "json"}, "adminKey": "dev-admin-key"}'
```

### Recovery Procedures
```bash
# Restore models
docker cp ./backup/models image-enhancer_image-enhancer_1:/app/models

# Restart services
docker-compose restart image-enhancer
```

## Security Considerations

### API Key Management
- Store API keys in environment variables
- Use different keys for development/production
- Rotate keys regularly
- Monitor API usage for anomalies

### Admin Access
- Change default admin key in production
- Use strong, random admin keys
- Implement IP whitelisting if needed
- Monitor admin command usage

### Network Security
- Use HTTPS in production
- Implement rate limiting
- Set up firewall rules
- Use VPN for admin access

## Performance Optimization

### Scaling Strategies
```bash
# Horizontal scaling with Docker Compose
docker-compose up --scale image-enhancer=3

# Load balancing configuration
# (Configure your load balancer to distribute requests)
```

### Caching Optimization
```bash
# Clear application cache
curl -X POST http://localhost:8000/api/admin \
  -H "Content-Type: application/json" \
  -d '{"command": "clear-cache", "adminKey": "dev-admin-key"}'
```

### Resource Monitoring
```bash
# Monitor container resources
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
```

## Common Issues and Solutions

### Issue: API Timeout
```bash
# Check API connectivity
curl -X POST http://localhost:8000/api/admin \
  -H "Content-Type: application/json" \
  -d '{"command": "test-apis", "adminKey": "dev-admin-key"}'

# Solution: Increase timeout or use fallback processing
```

### Issue: High Memory Usage
```bash
# Check memory usage
curl -X POST http://localhost:8000/api/admin \
  -H "Content-Type: application/json" \
  -d '{"command": "system-info", "adminKey": "dev-admin-key"}'

# Solution: Clear cache or restart container
docker-compose restart image-enhancer
```

### Issue: Processing Failures
```bash
# Debug specific image
curl -X POST http://localhost:8000/api/admin \
  -H "Content-Type: application/json" \
  -d '{"command": "debug-image", "args": {"imageId": "failed-id"}, "adminKey": "dev-admin-key"}'
```

## Support and Maintenance

### Regular Maintenance Tasks
1. Monitor API usage and costs
2. Update dependencies monthly
3. Backup training data weekly
4. Review logs for errors
5. Test fallback systems

### Update Procedures
```bash
# Update application
git pull origin main
docker-compose build --no-cache
docker-compose up -d

# Verify deployment
curl -X POST http://localhost:8000/api/admin \
  -H "Content-Type: application/json" \
  -d '{"command": "health", "adminKey": "dev-admin-key"}'
