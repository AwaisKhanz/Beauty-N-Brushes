# 📸 Google Cloud AI - Complete Step-by-Step Guide with Screenshots

**For:** Beauty N Brushes - AI Image Analysis Setup  
**Time Required:** 15-20 minutes

---

## 🎯 PART 1: Create Google Cloud Project

### **Step 1.1: Go to Google Cloud Console**

1. Open browser
2. Go to: **https://console.cloud.google.com/**
3. Sign in with your Google account

---

### **Step 1.2: Create New Project**

1. **Click** the project dropdown at the top (says "Select a project" or shows current project name)
2. **Click** "NEW PROJECT" button (top right of dialog)

3. **Fill in Project Details:**
   - **Project name:** `Beauty N Brushes AI` (or any name)
   - **Project ID:** Will auto-generate like `beauty-n-brushes-ai-xxxxx` (COPY THIS!)
   - **Organization:** Leave as "No organization"
4. **Click** "CREATE" button

5. **Wait** 20-30 seconds for project creation

6. **Select your new project** from the dropdown

---

## 🔧 PART 2: Enable Required APIs

### **Step 2.1: Go to APIs Library**

1. **Click** hamburger menu (☰) top left
2. **Navigate:** APIs & Services > **Library**
3. Or go directly to: https://console.cloud.google.com/apis/library

---

### **Step 2.2: Enable Cloud Vision API**

1. **In search box at top**, type: `Cloud Vision API`
2. **Click** on "Cloud Vision API" card
3. **Click** blue "ENABLE" button
4. **Wait** ~10 seconds for API to enable
5. You'll see "API enabled" checkmark

**✅ What this does:** Allows image analysis (detect hair types, colors, styles)

---

### **Step 2.3: Enable Vertex AI API**

1. **Click** back arrow or go to: https://console.cloud.google.com/apis/library
2. **In search box**, type: `Vertex AI API`
3. **Click** on "Vertex AI API" card
4. **Click** blue "ENABLE" button
5. **Wait** ~10 seconds

**✅ What this does:** Allows Gemini Pro (text generation) and embeddings

---

## 💳 PART 3: Enable Billing (REQUIRED)

### **Step 3.1: Go to Billing**

1. **Click** hamburger menu (☰)
2. **Click** "Billing"
3. Or go to: https://console.cloud.google.com/billing

---

### **Step 3.2: Create or Link Billing Account**

**If you don't have a billing account:**

1. **Click** "CREATE ACCOUNT" or "LINK A BILLING ACCOUNT"
2. **Select** country (United States, Canada, etc.)
3. **Fill in:**
   - Account name: "My Billing Account"
   - Country
   - Currency: USD (or your local currency)

4. **Click** "CONTINUE"

---

### **Step 3.3: Add Payment Method**

1. **Enter credit/debit card details:**
   - Card number
   - Expiration date
   - CVV
   - Billing address

2. **Click** "START MY FREE TRIAL" or "SUBMIT"

**🎁 Free Credits:**

- New accounts get $300 free credit (valid 90 days)
- After that: Vision API has 1,000 free requests/month

---

### **Step 3.4: Link Billing to Project**

1. **Go to:** Billing > Account Management
2. **Click** your billing account
3. **Click** "LINK A PROJECT"
4. **Select** "Beauty N Brushes AI" project
5. **Click** "SET ACCOUNT"

**✅ Verify:** Go to Billing page, you should see your project listed

---

## 👤 PART 4: Create Service Account

### **Step 4.1: Go to Service Accounts**

1. **Click** hamburger menu (☰)
2. **Navigate:** IAM & Admin > **Service Accounts**
3. Or go to: https://console.cloud.google.com/iam-admin/serviceaccounts

---

### **Step 4.2: Create Service Account**

1. **Click** "+ CREATE SERVICE ACCOUNT" button (top of page)

2. **Service Account Details (Page 1 of 3):**
   - **Service account name:** `beauty-ai-service`
   - **Service account ID:** Auto-fills (like `beauty-ai-service@your-project.iam.gserviceaccount.com`)
   - **Description:** `AI services for image analysis and matching`
3. **Click** "CREATE AND CONTINUE"

---

### **Step 4.3: Grant Roles (Page 2 of 3)**

**Add Role #1:**

1. **Click** "Select a role" dropdown
2. **Type** in search: `Vertex AI User`
3. **Click** "Vertex AI User" from results
4. **Click** "+ ADD ANOTHER ROLE"

**Add Role #2:** 5. **Click** "Select a role" dropdown 6. **Type** in search: `Cloud Vision` 7. **Select** "Cloud Vision > **Service Agent**" or "**Cloud Vision API User**" 8. **Click** "CONTINUE"

---

### **Step 4.4: Grant Users Access (Page 3 of 3)**

1. **Skip this step** - Click "DONE"

You should now see your service account in the list:

```
beauty-ai-service@your-project.iam.gserviceaccount.com
```

---

## 🔑 PART 5: Generate Service Account Key (JSON)

### **Step 5.1: Open Service Account**

1. **Click** on your service account email: `beauty-ai-service@...`

---

### **Step 5.2: Create Key**

1. **Click** the "KEYS" tab (at top, next to DETAILS, PERMISSIONS, METRICS)

2. **Click** "ADD KEY" dropdown button

3. **Click** "Create new key"

4. **Select** key type:
   - ✅ Select "JSON" (should be selected by default)
   - ❌ Don't select P12
5. **Click** "CREATE"

---

### **Step 5.3: Download Key**

- **File automatically downloads** to your Downloads folder
- **File name:** Something like `beauty-n-brushes-ai-abc123456789.json`
- **⚠️ WARNING APPEARS:** "This key file will not be shown again. Keep it secure."
- **Click** "CLOSE"

**🔒 SECURITY:**

- This file contains your credentials
- Never commit to git
- Never share publicly
- Keep it safe!

---

### **Step 5.4: Move Key to Backend**

Open terminal and run:

```bash
# Navigate to your project
cd "/Users/muhammadawais/Desktop/Fiverr Projects/Beauty N Brushes/backend"

# Copy the key from Downloads (update filename to match yours)
cp ~/Downloads/beauty-n-brushes-ai-*.json ./service-account-key.json

# Verify it's there
ls -la service-account-key.json
```

Should show:

```
-rw-r--r--  1 user  staff  2345 Oct 18 07:30 service-account-key.json
```

---

## ⚙️ PART 6: Configure Backend

### **Step 6.1: Update .env File**

1. **Open** `/backend/.env` in your editor

2. **Add or update these lines:**

```env
# ============================================
# AI CONFIGURATION
# ============================================

# Google Cloud AI (Primary - Best Quality)
USE_GOOGLE_AI=true
GOOGLE_CLOUD_PROJECT=beauty-n-brushes-ai-xxxxx  # ← YOUR PROJECT ID from Step 1.2
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

# OpenAI (Fallback - Required for embeddings currently)
OPENAI_API_KEY=sk-your-openai-key-here  # ← Get from platform.openai.com/api-keys
```

3. **Replace** `beauty-n-brushes-ai-xxxxx` with YOUR actual project ID

4. **Replace** `sk-your-openai-key-here` with your OpenAI API key

5. **Save** the file

---

### **Step 6.2: Verify .gitignore**

Check `/backend/.gitignore` or root `.gitignore` contains:

```gitignore
# Secrets
.env
.env.*
service-account-key.json
**/service-account*.json
```

This prevents accidentally committing secrets to git.

---

## 🧪 PART 7: Test Everything

### **Step 7.1: Restart Backend**

```bash
cd "/Users/muhammadawais/Desktop/Fiverr Projects/Beauty N Brushes/backend"
npm run dev
```

---

### **Step 7.2: Check Startup Logs**

Look for these messages:

✅ **SUCCESS:**

```
Google Cloud AI services initialized successfully
✅ Database connection successful
🚀 Server running on port 8000
```

❌ **ERROR (Billing):**

```
Google Vision API failed, falling back to OpenAI: 7 PERMISSION_DENIED:
This API method requires billing to be enabled.
```

**Fix:** Go back to Part 3 and enable billing

❌ **ERROR (Credentials):**

```
Error: Could not load the default credentials
```

**Fix:** Check `service-account-key.json` path in `.env`

---

### **Step 7.3: Test Image Analysis**

**As Provider:**

1. Go to: `http://localhost:3000/provider/services/create`
2. Fill in basic info
3. Upload a hairstyle photo
4. Save service

**Check Server Logs:**

```
Analyzing image: http://localhost:8000/uploads/...
AI analysis complete for ...: curly, afro, textured, vibrant
```

✅ **Working!** You'll see extracted tags

---

**As Client:**

1. Go to: `http://localhost:3000/client/search`
2. Upload an inspiration photo
3. Click "Analyze & Find Matches"

**Check Server Logs:**

```
Analyzing inspiration image: ...
AI analysis complete
```

✅ **Working!** You'll see matching services ranked by similarity

---

## 📊 API Usage & Costs

### **Free Tier (Monthly):**

- Vision API: **1,000 requests FREE**
- Vertex AI Gemini: **First $300 FREE** (new accounts)

### **After Free Tier:**

- Vision API: **$1.50 per 1,000 images**
- Gemini Pro: **$0.00025 per 1K characters**

### **Example Monthly Usage:**

- 100 services × 3 photos = 300 images
- 50 client inspiration searches = 50 images
- **Total: 350 images/month = FREE** (under 1,000 limit)

---

## 🎯 Summary: What Each Part Does

| Part                    | What                                     | Why                                              |
| ----------------------- | ---------------------------------------- | ------------------------------------------------ |
| **Project**             | Container for all resources              | Organizes your cloud resources                   |
| **Vision API**          | Analyzes images for hair, colors, styles | Better than GPT-4 Vision for visual features     |
| **Vertex AI**           | Gemini Pro, embeddings                   | Text generation and visual embeddings            |
| **Billing**             | Required to use APIs                     | Free tier available                              |
| **Service Account**     | Credentials for backend                  | Allows your app to call Google APIs              |
| **Service Account Key** | JSON file with credentials               | Backend uses this to authenticate                |
| **Roles**               | Permissions                              | Allows service account to use Vision + Vertex AI |

---

## ✅ Final Checklist

Before testing:

- [ ] Project created in Google Cloud Console
- [ ] Cloud Vision API enabled (green checkmark)
- [ ] Vertex AI API enabled (green checkmark)
- [ ] Billing account created and linked to project
- [ ] Service account created (`beauty-ai-service`)
- [ ] Roles assigned: Vertex AI User + Cloud Vision API User
- [ ] Service account key downloaded (JSON file)
- [ ] Key moved to `/backend/service-account-key.json`
- [ ] `.env` updated with project ID and credentials path
- [ ] Backend restarted
- [ ] Logs show "Google Cloud AI services initialized successfully"

---

## 🆘 Need Help?

**Common Issues:**

1. **"Billing not enabled"** → Enable billing (Part 3)
2. **"API not enabled"** → Enable APIs (Part 2)
3. **"Credentials not found"** → Check service account key path (Part 5.4)
4. **"Permission denied"** → Check service account roles (Part 4.3)

**Still stuck?** Check the detailed troubleshooting section in `GOOGLE_CLOUD_AI_SETUP.md`

---

**Ready?** Follow this guide step-by-step and you'll have professional-grade AI image analysis in 15 minutes! 🚀
