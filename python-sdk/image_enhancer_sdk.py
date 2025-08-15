#!/usr/bin/env python3
"""
Advanced Image Enhancement Python SDK
Provides programmatic access to the image enhancement API with debugging and batch processing capabilities.
"""

import requests
import json
import base64
import time
import os
import argparse
from typing import Dict, List, Optional, Union
from pathlib import Path
import logging

class ImageEnhancerSDK:
    """Python SDK for the Advanced Image Enhancement API"""
    
    def __init__(self, base_url: str = "http://localhost:8000", admin_key: Optional[str] = None):
        self.base_url = base_url.rstrip('/')
        self.admin_key = admin_key or os.getenv('ADMIN_KEY', 'dev-admin-key')
        self.session = requests.Session()
        self.logger = self._setup_logger()
        
    def _setup_logger(self) -> logging.Logger:
        """Setup logging for the SDK"""
        logger = logging.getLogger('ImageEnhancerSDK')
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            
        return logger
    
    def enhance_image(self, image_path: str, model: str = 'nightmareai/real-esrgan', 
                     options: Optional[Dict] = None) -> Dict:
        """
        Enhance a single image
        
        Args:
            image_path: Path to the image file
            model: AI model to use for enhancement
            options: Additional processing options
            
        Returns:
            Dictionary containing enhancement results
        """
        try:
            # Read and encode image
            with open(image_path, 'rb') as f:
                image_data = base64.b64encode(f.read()).decode('utf-8')
                image_data_url = f"data:image/jpeg;base64,{image_data}"
            
            payload = {
                'image': image_data_url,
                'model': model,
                'options': options or {}
            }
            
            self.logger.info(f"Enhancing image: {image_path}")
            response = self.session.post(
                f"{self.base_url}/api/enhance",
                json=payload,
                timeout=300  # 5 minutes timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                self.logger.info("Image enhancement completed successfully")
                return result
            else:
                error_msg = f"Enhancement failed: {response.status_code} - {response.text}"
                self.logger.error(error_msg)
                return {'error': error_msg}
                
        except Exception as e:
            error_msg = f"Error enhancing image: {str(e)}"
            self.logger.error(error_msg)
            return {'error': error_msg}
    
    def batch_enhance(self, image_paths: List[str], model: str = 'nightmareai/real-esrgan',
                     options: Optional[Dict] = None, max_concurrent: int = 3) -> List[Dict]:
        """
        Enhance multiple images in batch
        
        Args:
            image_paths: List of image file paths
            model: AI model to use for enhancement
            options: Additional processing options
            max_concurrent: Maximum concurrent requests
            
        Returns:
            List of enhancement results
        """
        results = []
        
        self.logger.info(f"Starting batch enhancement of {len(image_paths)} images")
        
        for i, image_path in enumerate(image_paths):
            self.logger.info(f"Processing image {i+1}/{len(image_paths)}: {image_path}")
            result = self.enhance_image(image_path, model, options)
            results.append({
                'image_path': image_path,
                'result': result
            })
            
            # Add small delay to avoid overwhelming the server
            if i < len(image_paths) - 1:
                time.sleep(1)
        
        self.logger.info("Batch enhancement completed")
        return results
    
    def classify_image(self, image_path: str) -> Dict:
        """
        Classify image quality and get enhancement recommendations
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dictionary containing classification results
        """
        try:
            with open(image_path, 'rb') as f:
                image_data = base64.b64encode(f.read()).decode('utf-8')
                image_data_url = f"data:image/jpeg;base64,{image_data}"
            
            payload = {'image': image_data_url}
            
            response = self.session.post(
                f"{self.base_url}/api/classify",
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {'error': f"Classification failed: {response.status_code}"}
                
        except Exception as e:
            return {'error': f"Error classifying image: {str(e)}"}
    
    def get_system_status(self) -> Dict:
        """Get system status and health information"""
        return self._admin_command('status')
    
    def get_health_check(self) -> Dict:
        """Perform health check on all services"""
        return self._admin_command('health')
    
    def get_logs(self, level: str = 'info', limit: int = 100) -> Dict:
        """Get system logs"""
        return self._admin_command('logs', {'level': level, 'limit': limit})
    
    def get_metrics(self, time_range: str = '24h') -> Dict:
        """Get system metrics and performance data"""
        return self._admin_command('metrics', {'timeRange': time_range})
    
    def test_apis(self) -> Dict:
        """Test connectivity to external APIs"""
        return self._admin_command('test-apis')
    
    def clear_cache(self) -> Dict:
        """Clear system caches"""
        return self._admin_command('clear-cache')
    
    def debug_image(self, image_id: str, include_metadata: bool = True) -> Dict:
        """Get debug information for a specific image processing"""
        return self._admin_command('debug-image', {
            'imageId': image_id,
            'includeMetadata': include_metadata
        })
    
    def export_data(self, data_type: str = 'all', format: str = 'json') -> Dict:
        """Export system data"""
        return self._admin_command('export-data', {
            'type': data_type,
            'format': format
        })
    
    def get_system_info(self) -> Dict:
        """Get detailed system information"""
        return self._admin_command('system-info')
    
    def _admin_command(self, command: str, args: Optional[Dict] = None) -> Dict:
        """Execute an admin command"""
        try:
            payload = {
                'command': command,
                'args': args or {},
                'adminKey': self.admin_key
            }
            
            response = self.session.post(
                f"{self.base_url}/api/admin",
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {'error': f"Admin command failed: {response.status_code} - {response.text}"}
                
        except Exception as e:
            return {'error': f"Error executing admin command: {str(e)}"}
    
    def save_enhanced_image(self, result: Dict, output_path: str) -> bool:
        """
        Save enhanced image from API result to file
        
        Args:
            result: Enhancement result from API
            output_path: Path to save the enhanced image
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if 'enhancedImage' not in result:
                self.logger.error("No enhanced image in result")
                return False
            
            enhanced_url = result['enhancedImage']
            
            if enhanced_url.startswith('data:'):
                # Base64 encoded image
                header, data = enhanced_url.split(',', 1)
                image_data = base64.b64decode(data)
            else:
                # URL to download
                response = self.session.get(enhanced_url)
                if response.status_code != 200:
                    self.logger.error(f"Failed to download enhanced image: {response.status_code}")
                    return False
                image_data = response.content
            
            with open(output_path, 'wb') as f:
                f.write(image_data)
            
            self.logger.info(f"Enhanced image saved to: {output_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error saving enhanced image: {str(e)}")
            return False

def main():
    """CLI interface for the SDK"""
    parser = argparse.ArgumentParser(description='Advanced Image Enhancement CLI')
    parser.add_argument('--base-url', default='http://localhost:8000', 
                       help='Base URL of the enhancement API')
    parser.add_argument('--admin-key', help='Admin key for privileged operations')
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Enhance command
    enhance_parser = subparsers.add_parser('enhance', help='Enhance a single image')
    enhance_parser.add_argument('input', help='Input image path')
    enhance_parser.add_argument('output', help='Output image path')
    enhance_parser.add_argument('--model', default='nightmareai/real-esrgan', 
                               help='AI model to use')
    enhance_parser.add_argument('--scale', type=int, default=4, help='Upscaling factor')
    
    # Batch enhance command
    batch_parser = subparsers.add_parser('batch', help='Enhance multiple images')
    batch_parser.add_argument('input_dir', help='Input directory containing images')
    batch_parser.add_argument('output_dir', help='Output directory for enhanced images')
    batch_parser.add_argument('--model', default='nightmareai/real-esrgan', help='AI model to use')
    batch_parser.add_argument('--scale', type=int, default=4, help='Upscaling factor')
    
    # Classify command
    classify_parser = subparsers.add_parser('classify', help='Classify image quality')
    classify_parser.add_argument('input', help='Input image path')
    
    # Status command
    subparsers.add_parser('status', help='Get system status')
    
    # Health command
    subparsers.add_parser('health', help='Perform health check')
    
    # Logs command
    logs_parser = subparsers.add_parser('logs', help='Get system logs')
    logs_parser.add_argument('--level', default='info', help='Log level')
    logs_parser.add_argument('--limit', type=int, default=100, help='Number of logs to retrieve')
    
    # Metrics command
    metrics_parser = subparsers.add_parser('metrics', help='Get system metrics')
    metrics_parser.add_argument('--time-range', default='24h', help='Time range for metrics')
    
    # Test APIs command
    subparsers.add_parser('test-apis', help='Test API connectivity')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Initialize SDK
    sdk = ImageEnhancerSDK(args.base_url, args.admin_key)
    
    # Execute command
    if args.command == 'enhance':
        options = {'scale': args.scale}
        result = sdk.enhance_image(args.input, args.model, options)
        
        if 'error' in result:
            print(f"Error: {result['error']}")
            return
        
        if sdk.save_enhanced_image(result, args.output):
            print(f"Image enhanced successfully: {args.output}")
        else:
            print("Failed to save enhanced image")
    
    elif args.command == 'batch':
        input_dir = Path(args.input_dir)
        output_dir = Path(args.output_dir)
        output_dir.mkdir(exist_ok=True)
        
        # Find all image files
        image_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}
        image_files = [f for f in input_dir.iterdir() 
                      if f.suffix.lower() in image_extensions]
        
        if not image_files:
            print(f"No image files found in {input_dir}")
            return
        
        options = {'scale': args.scale}
        results = sdk.batch_enhance([str(f) for f in image_files], args.model, options)
        
        successful = 0
        for item in results:
            result = item['result']
            if 'error' not in result:
                input_path = Path(item['image_path'])
                output_path = output_dir / f"enhanced_{input_path.name}"
                if sdk.save_enhanced_image(result, str(output_path)):
                    successful += 1
        
        print(f"Batch processing completed: {successful}/{len(results)} images enhanced")
    
    elif args.command == 'classify':
        result = sdk.classify_image(args.input)
        print(json.dumps(result, indent=2))
    
    elif args.command == 'status':
        result = sdk.get_system_status()
        print(json.dumps(result, indent=2))
    
    elif args.command == 'health':
        result = sdk.get_health_check()
        print(json.dumps(result, indent=2))
    
    elif args.command == 'logs':
        result = sdk.get_logs(args.level, args.limit)
        print(json.dumps(result, indent=2))
    
    elif args.command == 'metrics':
        result = sdk.get_metrics(args.time_range)
        print(json.dumps(result, indent=2))
    
    elif args.command == 'test-apis':
        result = sdk.test_apis()
        print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()
