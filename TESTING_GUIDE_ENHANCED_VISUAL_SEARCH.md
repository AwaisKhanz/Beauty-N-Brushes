# Testing Guide: Enhanced Visual Search

## Quick Start

### Prerequisites

1. ✅ Database migration applied
2. ✅ Backend server running
3. ✅ Frontend server running

### Apply Migration (One Time)

```bash
cd backend
psql $DATABASE_URL -f prisma/migrations/20251020_add_ai_description.sql
```

---

## Test Scenarios

### Test 1: Upload New Service Image (Provider Flow)

**Purpose:** Verify enhanced AI analysis generates 50-100+ tags and description

**Steps:**

1. Log in as a provider
2. Go to Services → Create New Service
3. Fill in service details
4. Upload a high-quality beauty service image (hair, nails, makeup, etc.)
5. Submit the service

**Expected Results:**

- ✅ Background processing starts
- ✅ After 5-10 seconds, check backend logs:
  ```
  📊 Analyzing comprehensive visual features (Hair)...
  🧠 Generating enriched multimodal embedding...
  ✅ Media processed successfully!
     Tags: 87 comprehensive tags
     Sample tags: woman, long-hair, dark-brown, wavy-texture, balayage
     Description: "A woman with long, dark brown, wavy hair..."
     Embedding: 1408-dim enriched vector
  ```
- ✅ Database: Check `ServiceMedia` table for `aiDescription` field populated

**Verify in Database:**

```sql
SELECT
  id,
  array_length("aiTags", 1) as tag_count,
  LEFT("aiDescription", 100) as description_preview
FROM "ServiceMedia"
WHERE "processingStatus" = 'completed'
ORDER BY "createdAt" DESC
LIMIT 5;
```

**Success Criteria:**

- Tag count: 50-100+
- Description: 3-5 sentences, professional language
- Embedding: 1408 dimensions

---

### Test 2: Visual Search (Client Flow)

**Purpose:** Verify comprehensive tags and description improve matching accuracy

**Steps:**

1. Go to `/visual-search` (no login required)
2. Upload a beauty inspiration image (similar style to existing services)
3. Wait for analysis (5-10 seconds)

**Expected Results:**

#### Analysis Display:

- ✅ "AI Visual Analysis" card appears
- ✅ Shows total tag count badge (e.g., "87 tags")
- ✅ Professional Analysis section shows:
  ```
  "A woman with long, dark brown, wavy hair styled in loose
  Hollywood waves showing a glossy, high-shine finish with
  caramel balayage highlights. She has warm medium skin tone..."
  ```
- ✅ Detected Features section shows all 50-100+ tags
- ✅ Tags are scrollable with clean styling
- ✅ Tags use accent colors for visual appeal

#### Match Results:

- ✅ Matches appear below analysis card
- ✅ Match scores: 90-100% for very similar styles
- ✅ Match scores: 70-85% for somewhat similar styles
- ✅ Match scores: <70% for different styles
- ✅ Results are diverse (not all clustered)

**Verify Match Quality:**

- Upload balayage hair image → Should match balayage services 90-100%
- Upload red nails image → Should match nail services with red 90-100%
- Upload smokey eye makeup → Should match makeup services 90-100%

**Backend Logs:**

```
🔍 Starting ephemeral visual search...
   Embedding dimensions: 1408
   Tags: woman, long-hair, balayage-highlights, ...

📊 Top Match (Vector-Only Scoring):
   Service: Balayage Color & Style
   Category: Hair
   Provider: Beautiful Hair Studio
   Distance: 0.0523
   Vector Score: 94%
   Matching Tags: balayage-highlights, caramel-tones, long-hair

✅ Matches after re-ranking: 15
   Top 3 scores: 94% (Vector), 89% (Vector), 85% (Vector)
```

---

### Test 3: Reprocess Existing Images

**Purpose:** Verify reprocessing script updates old images with enhanced analysis

**Steps:**

1. Open terminal
2. Run reprocessing script:
   ```bash
   cd backend
   npx ts-node src/scripts/reprocess-images-enhanced.ts
   ```

**Expected Output:**

```
🚀 Starting Enhanced Image Reprocessing...

📊 Found 45 images to reprocess

[1/45] Processing: abc123...
   Service: Balayage Highlights
   Category: Hair
   📊 Analyzing with enhanced AI (Hair)...
   🧠 Generating enriched embedding...
   ✅ Success!
      Tags: 92 comprehensive tags
      Sample: woman, long-hair, balayage, caramel-tones, wavy
      Description: "A woman with long, wavy dark brown hair..."
      Embedding: 1408-dim enriched vector
   ⏱️  Rate limiting (500ms)...

[2/45] Processing: def456...
...

============================================================
📊 Reprocessing Complete!
============================================================
Total Images:     45
✅ Processed:     44
❌ Failed:        1
⏭️  Skipped:       0
⏱️  Duration:      287s
📈 Avg/image:     6.4s
============================================================
```

**Success Criteria:**

- ✅ All images processed (or minimal failures)
- ✅ Average processing time: 5-8 seconds per image
- ✅ Database updated with new tags and descriptions

**Verify in Database:**

```sql
-- Check updated images
SELECT
  COUNT(*) as total_with_descriptions,
  AVG(array_length("aiTags", 1)) as avg_tag_count
FROM "ServiceMedia"
WHERE "aiDescription" IS NOT NULL;
```

Expected result:

- `total_with_descriptions`: All processed images
- `avg_tag_count`: 50-100+

---

### Test 4: Tag Quality by Category

**Purpose:** Verify category-specific tags are comprehensive and relevant

#### Test Hair Service Image

**Upload:** Professional hair styling/coloring photo

**Expected Tags (50-100+):**

- Hair specifics: `long-hair`, `wavy-texture`, `balayage-highlights`, `caramel-tones`, `glossy-finish`, `high-shine`, `natural-texture`
- Person: `woman`, `medium-skin-tone`, `defined-eyebrows`, `natural-makeup`
- Setting: `professional-salon`, `salon-chair`, `warm-lighting`, `soft-light`
- Tools: `styling-brush`, `product-bottles`, `mirror-background`
- Mood: `confident`, `relaxed`, `happy`, `polished-look`
- Quality: `professional-grade`, `expert-level`, `luxury-service`

#### Test Nail Service Image

**Upload:** Professional nail art photo

**Expected Tags (50-100+):**

- Nail specifics: `almond-nails`, `long-nails`, `french-manicure`, `nude-pink`, `glossy-finish`, `gel-nails`
- Design: `floral-art`, `hand-painted`, `delicate-design`, `white-accents`
- Person: `woman`, `light-skin-tone`, `well-groomed`
- Setting: `nail-salon`, `professional-setting`, `clean-workspace`
- Tools: `nail-brush`, `polish-bottles`, `files`, `buffers`
- Quality: `intricate-detail`, `professional-artistry`, `expert-technique`

#### Test Makeup Service Image

**Upload:** Professional makeup application photo

**Expected Tags (50-100+):**

- Makeup specifics: `smokey-eye`, `winged-liner`, `false-lashes`, `contoured-cheeks`, `nude-lips`, `matte-foundation`
- Eyes: `dramatic-eye`, `blended-shadow`, `shimmer-shadow`, `defined-crease`
- Face: `sculpted-contour`, `highlight-cheekbones`, `flawless-skin`
- Person: `woman`, `dark-skin-tone`, `oval-face`
- Setting: `professional-studio`, `makeup-station`, `ring-light`, `clean-background`
- Tools: `makeup-brushes`, `palette`, `beauty-blender`, `product-bottles`
- Style: `glam-makeup`, `special-event`, `dramatic-look`, `polished-finish`

---

### Test 5: Description Quality

**Purpose:** Verify natural language descriptions are comprehensive and professional

**Upload any beauty service image**

**Expected Description Format (3-5 sentences):**

✅ **Good Example:**

```
"A woman with long, dark brown, wavy hair styled in loose Hollywood
waves showing a glossy, high-shine finish with subtle caramel balayage
highlights. She has warm medium skin tone, defined arched eyebrows in
dark brown, and is wearing natural glam makeup featuring a soft smokey
eye. She's wearing a delicate gold necklace and appears to be in a
professional salon setting with soft, warm lighting. The overall
aesthetic is polished, luxurious, and camera-ready."
```

**Quality Checks:**

- ✅ 3-5 complete sentences
- ✅ Uses professional industry terminology
- ✅ Describes person (if visible): appearance, features
- ✅ Describes service specifics: technique, style, finish
- ✅ Describes setting: environment, lighting, atmosphere
- ✅ Describes mood/aesthetic: overall impression
- ✅ No brand names or products mentioned
- ✅ No assumptions about things not visible
- ✅ Grammatically correct and natural-sounding

❌ **Bad Example:**

```
"Hair. Nice style. Looks good."
```

---

### Test 6: Matching Accuracy

**Purpose:** Verify enhanced embeddings achieve 90-100% matching for similar styles

#### Scenario A: Nearly Identical Style

**Test Image:** Upload balayage hair photo with caramel highlights
**Expected Match:** Balayage services with similar tones
**Expected Score:** 90-100%

#### Scenario B: Similar Category, Different Style

**Test Image:** Upload balayage hair photo
**Expected Match:** Other hair color services
**Expected Score:** 70-85%

#### Scenario C: Different Category

**Test Image:** Upload balayage hair photo
**Expected Match:** Nail or makeup services
**Expected Score:** <50% (should not match)

**Success Criteria:**

- ✅ Top 3 matches have 85-100% scores
- ✅ Matches are visually similar to test image
- ✅ Different styles score appropriately lower
- ✅ Different categories have low scores
- ✅ Results show diversity (not all identical)

---

### Test 7: Frontend UI/UX

**Purpose:** Verify enhanced UI displays beautifully and works smoothly

**Visual Search Page (`/visual-search`):**

#### Upload Section:

- ✅ Clean, modern upload interface
- ✅ Drag and drop works
- ✅ File selection works
- ✅ Loading state shows during analysis
- ✅ Progress indicator visible

#### Analysis Display:

- ✅ AI Analysis card appears after upload
- ✅ Card uses gradient background (primary/accent colors)
- ✅ "Professional Analysis" section has:
  - Light background
  - Primary color heading
  - Readable description text
  - Clean padding/spacing
- ✅ "Detected Features" section has:
  - Tag count badge (e.g., "87 tags")
  - Scrollable tag container (max-height)
  - Tags with hover effects
  - Accent colors for tags
  - Smooth scrolling

#### Match Results:

- ✅ Results appear below analysis
- ✅ Match score prominently displayed
- ✅ Service images load properly
- ✅ Provider information visible
- ✅ Click to view service details works

#### Responsive Design:

- ✅ Desktop (1920px): Full width, multi-column grid
- ✅ Tablet (768px): 2-column grid
- ✅ Mobile (375px): Single column, stacked layout
- ✅ Tags wrap properly on all screens
- ✅ Scrolling works on touch devices

---

### Test 8: Performance

**Purpose:** Verify system meets performance targets

**Metrics to Measure:**

#### Analysis Performance:

- **Tag Generation:** <3 seconds ✅
- **Embedding Generation:** <2 seconds ✅
- **Total Analysis Time:** <5 seconds ✅

#### Search Performance:

- **Vector Search Query:** <500ms ✅
- **Result Transformation:** <100ms ✅
- **Total Search Time:** <1 second ✅

#### User Experience:

- **Upload to Analysis Display:** <6 seconds ✅
- **Analysis to Match Results:** <2 seconds ✅
- **Total User Wait Time:** <8 seconds ✅

**How to Measure:**

- Check backend logs for timing information
- Use browser DevTools Network tab
- Monitor database query performance
- User perception: "Feels fast" ✅

---

### Test 9: Error Handling

**Purpose:** Verify graceful error handling

#### Test Error Scenarios:

1. **Invalid Image Format:**
   - Upload PDF or text file
   - Expected: User-friendly error message

2. **Image Too Large:**
   - Upload >10MB image
   - Expected: Size error message

3. **API Failure:**
   - Temporarily disable Google Cloud credentials
   - Expected: Fallback behavior, error message

4. **Network Timeout:**
   - Simulate slow network
   - Expected: Timeout handling, retry option

5. **No Matches Found:**
   - Upload very unusual/unrelated image
   - Expected: "No matches found" message with suggestions

**Success Criteria:**

- ✅ All errors handled gracefully
- ✅ User-friendly error messages
- ✅ No crashes or white screens
- ✅ Ability to retry after error

---

## Regression Testing

### Verify Existing Functionality Still Works:

1. ✅ Provider service creation flow
2. ✅ Client service browsing
3. ✅ Text-based search
4. ✅ Booking flow
5. ✅ Provider dashboard
6. ✅ Client dashboard
7. ✅ User authentication
8. ✅ Payment processing

---

## Production Checklist

Before deploying to production:

### Backend:

- [ ] Database migration applied to production database
- [ ] Environment variables set (Google Cloud credentials)
- [ ] Backend server restarted
- [ ] Health check endpoint working
- [ ] Background job queue running

### Frontend:

- [ ] Build succeeds without errors
- [ ] TypeScript compilation passes
- [ ] Linting passes
- [ ] No console errors in browser

### Monitoring:

- [ ] Setup error tracking (Sentry, etc.)
- [ ] Setup performance monitoring
- [ ] Setup cost tracking for AI APIs
- [ ] Setup uptime monitoring

### Documentation:

- [ ] Update API documentation
- [ ] Update user guides (if needed)
- [ ] Update internal documentation

---

## Troubleshooting

### Issue: Tags not showing in visual search

**Solution:**

1. Check browser console for errors
2. Verify API response includes `tags` array
3. Check frontend state management
4. Clear browser cache

### Issue: Description not displaying

**Solution:**

1. Verify database migration applied
2. Check `aiDescription` field exists in database
3. Verify API response includes `description`
4. Check frontend conditional rendering

### Issue: Low match scores (<50%)

**Solution:**

1. Verify embeddings are using enriched context
2. Check description and tags are included in embedding
3. Run reprocessing script for existing images
4. Verify vector search uses cosine distance

### Issue: Slow analysis (>10 seconds)

**Solution:**

1. Check Google Cloud API quotas
2. Verify network connection
3. Check rate limiting
4. Monitor API response times

---

## Success Metrics

### Quantitative:

- ✅ Tag count: 50-100+ per image
- ✅ Description length: 3-5 sentences
- ✅ Match accuracy: 90-100% for similar styles
- ✅ Analysis time: <6 seconds
- ✅ Search time: <2 seconds
- ✅ Zero linting errors
- ✅ Zero TypeScript errors

### Qualitative:

- ✅ Tags are comprehensive and relevant
- ✅ Descriptions are professional and detailed
- ✅ Matches feel accurate to users
- ✅ UI is beautiful and intuitive
- ✅ Performance feels fast
- ✅ No user confusion or friction

---

## Next Steps After Testing

1. ✅ Fix any issues found during testing
2. ✅ Document any edge cases
3. ✅ Run reprocessing script for existing images
4. ✅ Monitor performance in production
5. ✅ Collect user feedback
6. ✅ Iterate on prompt improvements

---

**Happy Testing!** 🚀

For questions or issues, refer to:

- `ENHANCED_VISUAL_SEARCH_IMPLEMENTATION.md` - Implementation details
- Backend logs - Detailed processing information
- Browser DevTools - Frontend debugging
