# Troubleshooting Guide - Advanced Image Enhancement App

## Common Issues and Solutions

### 🔑 Replicate API Credit Issues

#### Problem: "Insufficient credit" error after payment
**Symptoms:**
- Error message: "Insufficient Replicate credits"
- HTTP 402 status code
- Recent payment made to Replicate account

**Solutions:**
1. **Wait for Credit Processing** (Most Common)
   - Replicate credits can take 5-15 minutes to process after payment
   - Wait 10 minutes and try again
   - Check your account balance at https://replicate.com/account/billing

2. **Verify API Key**
   - Ensure your API key is correct in `.env.local`
   - API key format should be: `r8_xxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Generate a new API key if needed at https://replicate.com/account/api-tokens

3. **Check Account Status**
   - Log into https://replicate.com/account
   - Verify payment was processed successfully
   - Check for any account restrictions

4. **Test API Key**
   ```bash
   curl -H "Authorization: Token YOUR_API_KEY" https://api.replicate.com/v1/account
   ```

#### Problem: API key not working
**Solutions:**
1. **Regenerate API Key**
   - Go to https://replicate.com/account/api-tokens
   - Delete old key and create new one
   - Update `.env.local` with new key
   - Restart development server

2. **Check Environment Variables**
   ```bash
   # Verify .env.local exists and has correct format
   cat .env.local
   
   # Should show:
   # REPLICATE_API_KEY=r8_your_key_here
   # OPENROUTER_API_KEY=sk-or-v1-your_key_here
   ```

### 🌐 OpenRouter API Issues

#### Problem: Classification not working
**Solutions:**
1. **Verify API Key Format**
   - Should start with `sk-or-v1-`
