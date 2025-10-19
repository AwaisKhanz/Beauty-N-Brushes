# 🔧 Google Cloud AI Setup Guide

**For:** Beauty N Brushes AI-Powered Image Analysis  
**Purpose:** Enable Vision AI for superior image analysis and true visual embeddings

---

## 📋 Prerequisites

- Google account
- Credit card (for billing - free tier available)
- Terminal access

---

## 🚀 Step-by-Step Setup

### **Step 1: Create Google Cloud Project**

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create New Project**
   - Click dropdown at top (next to "Google Cloud")
   - Click "NEW PROJECT"
   - **Project Name:** `beauty-n-brushes-ai`
   - **Project ID:** Will auto-generate (note this down!)
   - Click "CREATE"

3. **Select Your Project**
   - Wait for project creation (~30 seconds)
   - Select the project from the dropdown

---

### **Step 2: Enable Required APIs**

Go to: **APIs & Services > Library** or visit:
https://console.cloud.google.com/apis/library

Enable these APIs (click each + Enable):

1. ✅ **Cloud Vision API**
   - Search: "Cloud Vision API"
   - Click "ENABLE"
   - Purpose: Image analysis (hair type, style, colors)

2. ✅ **Vertex AI API**
   - Search: "Vertex AI API"
   - Click "ENABLE"
   - Purpose: Gemini Pro (text generation), embeddings

---

### **Step 3: Enable Billing**

⚠️ **REQUIRED** - Free tier available but billing must be enabled

1. **Go to Billing**
   - Menu > Billing
   - Or: https://console.cloud.google.com/billing

2. **Link Billing Account**
   - Click "LINK A BILLING ACCOUNT"
   - Create new billing account or select existing
   - Add payment method (credit card)

3. **Confirm Billing Enabled**
   - Go to: APIs & Services > Cloud Vision API > Quotas
   - Should show quotas (not "Billing required")

**💰 Free Tier Limits (Monthly):**

- Vision API: 1,000 requests/month FREE
- Vertex AI: $0 for first month trial
- After free tier: ~$1.50 per 1,000 image analyses

---

### **Step 4: Create Service Account**

1. **Go to IAM & Admin > Service Accounts**
   - https://console.cloud.google.com/iam-admin/serviceaccounts

2. **Create Service Account**
   - Click "+ CREATE SERVICE ACCOUNT"

   **Details:**
   - Service account name: `beauty-ai-service`
   - Service account ID: `beauty-ai-service@PROJECT_ID.iam.gserviceaccount.com`
   - Description: "AI services for Beauty N Brushes"
   - Click "CREATE AND CONTINUE"

3. **Grant Roles**
   Add these roles:
   - ✅ **Vertex AI User**
   - ✅ **Cloud Vision API User**

   Click "CONTINUE" → "DONE"

---

### **Step 5: Generate Service Account Key**

1. **Find Your Service Account**
   - In Service Accounts list, find `beauty-ai-service`
   - Click on it

2. **Create Key**
   - Go to "KEYS" tab
   - Click "ADD KEY" > "Create new key"
   - Select **JSON** format
   - Click "CREATE"

3. **Download Key**
   - File downloads automatically: `beauty-n-brushes-ai-xxxxx.json`
   - **IMPORTANT:** Keep this file secure! Never commit to git!

4. **Move Key to Backend**
   ```bash
   # From your downloads folder
   mv ~/Downloads/beauty-n-brushes-ai-*.json \
      "/Users/muhammadawais/Desktop/Fiverr Projects/Beauty N Brushes/backend/service-account-key.json"
   ```

---

### **Step 6: Update Backend Environment Variables**

Edit `/backend/.env`:

```env
# ============================================
# AI CONFIGURATION (REQUIRED)
# ============================================

# Primary AI Provider (Google Cloud AI - RECOMMENDED)
USE_GOOGLE_AI=true
GOOGLE_CLOUD_PROJECT=beauty-n-brushes-ai  # ← Your project ID from Step 1
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

# OpenAI (Fallback when Google fails)
OPENAI_API_KEY=sk-your-openai-key-here  # ← Your OpenAI key (optional but recommended)
```

**Note:** You can use ONLY OpenAI if you prefer:

```env
USE_GOOGLE_AI=false
OPENAI_API_KEY=sk-your-openai-key-here
```

---

### **Step 7: Verify Setup**

1. **Restart Backend Server**

   ```bash
   cd backend
   npm run dev
   ```

2. **Check Logs**
   You should see:

   ```
   ✅ Google Cloud AI services initialized successfully
   ```

3. **Test Image Analysis**
   Upload a service photo and check logs for:
   ```
   Analyzing image: ...
   AI analysis complete for ...: curly, afro, vibrant, ...
   ```

---

## 🔍 Troubleshooting

### **Error: "Billing not enabled"**

```
7 PERMISSION_DENIED: This API method requires billing to be enabled
```

**Fix:**

1. Go to: https://console.cloud.google.com/billing
2. Enable billing for your project
3. Wait 5-10 minutes for propagation
4. Retry

---

### **Error: "Service account not found"**

```
Error: Could not load the default credentials
```

**Fix:**

1. Verify `service-account-key.json` exists in `/backend/`
2. Check `GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json` in `.env`
3. Restart backend server

---

### **Error: "API not enabled"**

```
PERMISSION_DENIED: Cloud Vision API has not been used
```

**Fix:**

1. Go to: https://console.cloud.google.com/apis/library
2. Search "Cloud Vision API"
3. Click "ENABLE"
4. Wait 1-2 minutes
5. Retry

---

### **Error: "Project ID not found"**

**Fix:**

1. Check project ID: https://console.cloud.google.com/home/dashboard
2. Update `GOOGLE_CLOUD_PROJECT` in `.env`
3. Restart server

---

## 💡 Why Google Cloud AI?

### **Advantages over OpenAI:**

1. **Superior Image Analysis**
   - Vision AI trained specifically on visual features
   - Better detection of hair types, textures, styles
   - Face attribute analysis (shape, skin tone)
   - Color palette extraction from actual pixels

2. **True Visual Embeddings**
   - Generates 512-dim vectors from IMAGE PIXELS
   - Not text descriptions of images
   - Better for finding visually similar styles
   - More accurate color/texture matching

3. **Cost Effective**
   - 1,000 free requests/month
   - ~$1.50 per 1,000 after free tier
   - OpenAI Vision: $0.01 per image (~$10 per 1,000)

4. **Faster Processing**
   - Vision API optimized for batch processing
   - Lower latency than OpenAI Vision

---

## 🔄 Fallback System

The system automatically falls back to OpenAI if Google fails:

```typescript
try {
  // Try Google Vision AI first
  return await this.analyzeImageWithGoogleVision(imageUrl);
} catch (error) {
  // Fall back to OpenAI
  console.warn('Google Vision failed, using OpenAI...');
  return this.analyzeImageWithOpenAI(imageUrl);
}
```

**Requirements for Fallback:**

- Set `OPENAI_API_KEY` in `.env`
- OpenAI API key from: https://platform.openai.com/api-keys

---

## 📊 Current AI Configuration

Your `ai.ts` uses:

### **Text Generation (Policies, Descriptions):**

- **Primary:** Google Gemini Pro (`gemini-1.5-pro`)
- **Fallback:** OpenAI GPT-4

### **Image Analysis:**

- **Primary:** Google Vision AI
- **Fallback:** OpenAI GPT-4 Vision (`gpt-4o`)

### **Embeddings (Vector Search):**

- **For Images:** Google Vision AI visual features (512-dim)
- **For Text:** Google Text Embedding Gecko
- **Fallback:** OpenAI text-embedding-ada-002 (truncated to 512-dim)

---

## 🎯 What Works Now (Without Google Cloud)

If you're **ONLY using OpenAI** (no Google Cloud setup):

### ✅ **Working:**

- Image analysis with GPT-4 Vision (base64)
- Text generation (descriptions, policies)
- Text-based embeddings (truncated to 512-dim)

### ⚠️ **Limited:**

- Embeddings are text-based (not true visual features)
- Higher cost ($0.01 per image vs $0.0015)
- Less accurate visual similarity

### ❌ **Not Available:**

- True pixel-based visual embeddings
- Advanced color histogram analysis
- Face attribute detection

---

## 📝 Quick Start (OpenAI Only)

If you want to skip Google Cloud for now:

**1. Update `.env`:**

```env
USE_GOOGLE_AI=false
OPENAI_API_KEY=sk-your-openai-key-here
```

**2. Get OpenAI Key:**

- Go to: https://platform.openai.com/api-keys
- Click "+ Create new secret key"
- Copy the key (starts with `sk-`)
- Add to `.env`

**3. Restart Server**

```bash
cd backend && npm run dev
```

**4. Test**

- Upload service photos
- Upload inspiration photos
- Should work with text-based embeddings

---

## 🎨 Recommended Setup

**For Best Results:**

✅ **Enable Google Cloud AI** (this guide)  
✅ **Keep OpenAI as fallback** (for reliability)

This gives you:

- Best visual analysis quality
- Lowest cost
- Automatic fallback if one service fails
- True CLIP-like visual embeddings

---

## 📚 Additional Resources

- **Google Cloud Console:** https://console.cloud.google.com
- **Vision AI Pricing:** https://cloud.google.com/vision/pricing
- **Vertex AI Pricing:** https://cloud.google.com/vertex-ai/pricing
- **OpenAI Pricing:** https://openai.com/api/pricing/

---

## 🔐 Security Reminders

1. ✅ **Never commit `service-account-key.json`** to git (already in `.gitignore`)
2. ✅ **Keep `.env` file secret** (never share or commit)
3. ✅ **Rotate keys regularly** (every 90 days recommended)
4. ✅ **Use separate keys** for dev/staging/production
5. ✅ **Enable billing alerts** in Google Cloud to avoid surprises

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Google Cloud project created
- [ ] Cloud Vision API enabled
- [ ] Vertex AI API enabled
- [ ] Billing enabled on project
- [ ] Service account created with proper roles
- [ ] Service account key downloaded
- [ ] Key placed in `/backend/service-account-key.json`
- [ ] `.env` updated with Google Cloud credentials
- [ ] Backend server restarted
- [ ] Log shows "Google Cloud AI services initialized successfully"
- [ ] Test upload shows AI analysis working

---

**Setup Time:** ~15-20 minutes  
**Cost:** Free tier (1,000 images/month) then ~$1.50 per 1,000  
**Recommended:** Yes - for production-quality visual search
