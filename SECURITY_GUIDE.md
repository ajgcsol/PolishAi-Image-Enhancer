# Security Guide: Publishing to GitHub Safely

## 🔒 Overview

This guide ensures you can safely publish your Advanced Image Enhancement application to GitHub without exposing sensitive API keys or credentials.

## ✅ Pre-Publication Checklist

### 1. Environment Files Security
- [ ] `.env.local` is in `.gitignore`
- [ ] `.env.example` contains no real API keys
- [ ] All sensitive files are listed in `.gitignore`
- [ ] No hardcoded API keys in source code

### 2. API Key Management
- [ ] API keys are stored in environment variables only
- [ ] Different keys for development/production
- [ ] Keys are not in any committed files
- [ ] Keys have appropriate permissions/scopes

### 3. Git History Clean
- [ ] No API keys in previous commits
- [ ] Sensitive files never committed
- [ ] Clean commit history

## 🚫 Files to NEVER Commit

### Environment Files
```
.env
.env.local
.env.production
.env.staging
.env.development.local
.env.test.local
.env.production.local
```

### Configuration Files with Secrets
```
config/secrets.json
secrets/
*.key
*.pem
*.p12
docker-compose.override.yml
```

### Local Data
```
models/cache/
models/custom/
models/enhancement/
models/super-resolution/
models/deblurring/
temp/
uploads/
downloads/
logs/
```

## 🔧 Safe Publishing Steps

### Step 1: Verify .gitignore
```bash
# Check if .gitignore exists and is comprehensive
cat .gitignore

# Verify sensitive files are ignored
git status --ignored
```

### Step 2: Remove Sensitive Data from History
```bash
# If you accidentally committed sensitive files, remove them:
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env.local' \
  --prune-empty --tag-name-filter cat -- --all

# Or use git-filter-repo (recommended):
git filter-repo --path .env.local --invert-paths
```

### Step 3: Clean Current Repository
```bash
# Remove any sensitive files from staging
git rm --cached .env.local
git rm --cached -r models/cache/
git rm --cached -r logs/

# Add to .gitignore if not already there
echo ".env.local" >> .gitignore
echo "models/cache/" >> .gitignore
echo "logs/" >> .gitignore
```

### Step 4: Verify Clean State
```bash
# Check what will be committed
git status

# Verify no sensitive data in files to be committed
git diff --cached

# Check for any remaining sensitive patterns
grep -r "sk-or-v1" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "r8_" . --exclude-dir=node_modules --exclude-dir=.git
```

### Step 5: Safe Commit and Push
```bash
# Commit the clean repository
git add .
git commit -m "feat: add advanced image enhancement application

- AI-powered image enhancement with fallback processing
- Administrative tools and Python SDK
- Docker containerization support
- Comprehensive cost analysis and deployment guides"

# Push to GitHub
git remote add origin https://github.com/yourusername/your-repo-name.git
git branch -M main
git push -u origin main
```

## 🔐 Environment Variable Management

### Local Development
```bash
# Copy example file
cp .env.example .env.local

# Edit with your actual keys
nano .env.local
```

### Production Deployment

#### Vercel
```bash
# Set environment variables in Vercel dashboard
vercel env add REPLICATE_API_KEY
vercel env add OPENROUTER_API_KEY
vercel env add ADMIN_KEY
```

#### Netlify
```bash
# Set in Netlify dashboard under Site settings > Environment variables
# Or use Netlify CLI:
netlify env:set REPLICATE_API_KEY your_key_here
netlify env:set OPENROUTER_API_KEY your_key_here
netlify env:set ADMIN_KEY your_secure_key_here
```

#### Docker/Docker Compose
```bash
# Use environment file (not committed to Git)
echo "REPLICATE_API_KEY=your_key" > .env.production
echo "OPENROUTER_API_KEY=your_key" >> .env.production
echo "ADMIN_KEY=your_secure_key" >> .env.production

# Reference in docker-compose.yml
env_file:
  - .env.production
```

#### Kubernetes
```yaml
# Create secret
apiVersion: v1
kind: Secret
metadata:
  name: api-keys
type: Opaque
stringData:
  replicate-key: your_replicate_key
  openrouter-key: your_openrouter_key
  admin-key: your_secure_admin_key
```

## 🛡️ Security Best Practices

### API Key Security
1. **Rotate Keys Regularly**: Change API keys every 90 days
2. **Use Least Privilege**: Only grant necessary permissions
3. **Monitor Usage**: Set up alerts for unusual API activity
4. **Separate Environments**: Different keys for dev/staging/prod

### Code Security
1. **No Hardcoded Secrets**: Always use environment variables
2. **Validate Inputs**: Sanitize all user inputs
3. **Rate Limiting**: Implement API rate limiting
4. **HTTPS Only**: Use HTTPS in production

### Repository Security
1. **Branch Protection**: Require PR reviews for main branch
2. **Secret Scanning**: Enable GitHub secret scanning
3. **Dependency Updates**: Keep dependencies updated
4. **Security Advisories**: Monitor for security issues

## 🚨 Emergency Response

### If API Keys Are Exposed

1. **Immediate Actions**:
   ```bash
   # Revoke compromised keys immediately
   # - Go to Replicate dashboard and delete the key
   # - Go to OpenRouter dashboard and delete the key
   
   # Generate new keys
   # - Create new API keys with different names
   # - Update your local .env.local file
   # - Update production environment variables
   ```

2. **Clean Git History**:
   ```bash
   # Remove sensitive data from Git history
   git filter-repo --path .env.local --invert-paths
   git push --force-with-lease origin main
   ```

3. **Monitor for Abuse**:
   - Check API usage dashboards
   - Monitor billing for unexpected charges
   - Review access logs if available

### If Repository is Compromised

1. **Change All Credentials**:
   - API keys
   - Admin passwords
   - Database credentials
   - SSH keys

2. **Review Access**:
   - Check repository collaborators
   - Review recent commits
   - Audit deployment keys

3. **Notify Stakeholders**:
   - Team members
   - Users if data was exposed
   - API providers if necessary

## 📋 Security Checklist for Contributors

### Before Contributing
- [ ] Read this security guide
- [ ] Set up local environment properly
- [ ] Never commit sensitive data
- [ ] Use secure coding practices

### Code Review Checklist
- [ ] No hardcoded secrets
- [ ] Proper input validation
- [ ] No sensitive data in logs
- [ ] Environment variables used correctly
- [ ] Dependencies are secure

### Deployment Checklist
- [ ] Environment variables configured
- [ ] HTTPS enabled
- [ ] Rate limiting implemented
- [ ] Monitoring set up
- [ ] Backup procedures in place

## 🔗 Additional Resources

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Docker Secrets Management](https://docs.docker.com/engine/swarm/secrets/)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)

## 📞 Support

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. Email security concerns to: [your-security-email]
3. Include detailed information about the vulnerability
4. Allow reasonable time for response before public disclosure

---

**Remember: Security is everyone's responsibility. When in doubt, err on the side of caution.**
