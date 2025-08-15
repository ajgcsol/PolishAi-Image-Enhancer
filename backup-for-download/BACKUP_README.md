# 🔒 Private Backup Files - DO NOT SHARE

This backup contains sensitive files that should **NEVER** be shared publicly or committed to GitHub.

## 📁 Contents

### 🔑 Environment Files
- `.env.local` - Contains your actual API keys
  - Replicate API Key: `your_replicate_api_key_here`
  - OpenRouter API Key: `your_openrouter_api_key_here`

### 📋 Setup Instructions
- `local-setup-guide.md` - Complete setup instructions for your local machine

## 🚨 SECURITY WARNING

**KEEP THESE FILES SECURE:**
- Never share these files with anyone
- Never commit them to any Git repository
- Store them in a secure location (password manager, encrypted drive)
- Use different API keys for production deployments

## 🔧 How to Use These Files

### On Your Local Machine:

1. **Download this entire backup folder**
2. **Copy `.env.local` to your project root:**
   ```bash
   cp .env.local /path/to/your/project/.env.local
   ```
3. **Verify the file is ignored by Git:**
   ```bash
   git check-ignore .env.local
   # Should return: .env.local
   ```

### For Production Deployment:

**DO NOT use these exact keys in production!**

Instead:
1. Create new API keys for production
2. Use your deployment platform's environment variable system
3. Follow the security guidelines in `SECURITY_GUIDE.md`

## 💰 API Key Information

### Replicate API Key
- **Purpose**: AI image enhancement models
- **Models**: Real-ESRGAN, GFPGAN, CodeFormer
- **Cost**: ~$0.025 per image enhancement
- **Manage**: https://replicate.com/account/api-tokens

### OpenRouter API Key
- **Purpose**: AI-powered image quality analysis
- **Model**: Claude Sonnet 4 (default)
- **Cost**: ~$0.0045 per classification
- **Manage**: https://openrouter.ai/keys

## 🔄 Key Rotation

For security, rotate these keys every 90 days:

1. **Generate new keys** from the respective platforms
2. **Update your `.env.local` file**
3. **Update production environment variables**
4. **Revoke old keys** from the platforms

## 📞 Emergency Contact

If these keys are compromised:
1. **Immediately revoke** them from the platforms
2. **Generate new keys**
3. **Update all deployments**
4. **Monitor for unusual API usage**

---

**Remember: These are YOUR private keys. Keep them safe!** 🔐
