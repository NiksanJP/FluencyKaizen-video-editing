# Reference Format Analysis & Discovery

## Target Format: TikTok/YouTube Shorts Business English Educational

### Platform Specifications
- **Aspect ratio**: 9:16 (vertical/portrait)
- **Resolution**: 1080x1920 minimum (HD)
- **Duration**: 15-60 seconds optimal (platform's sweet spot)
- **Format**: MP4 H.264 codec
- **Frame rate**: 24-60 fps (30 fps standard)
- **Audience**: Japanese professionals learning Business English

---

## Visual Component Breakdown (5 Layers Identified)

### Layer 1: Hook Title (Always Visible)
**Purpose**: Immediate content preview and engagement hook

**Position**: Top center, ~60-100px from top
**Size**: Large and bold, readable at 1/4 screen size
**Typography**:
- Primary text: Large (36-48px), bold weight, white color
- Secondary text: Medium (18-24px), secondary color (gold/yellow)
- Content: 1-line English + 1-line Japanese translation

**Visual Style**:
- White text with black outline/stroke (for contrast over video)
- Static (no animation)
- Persistent (visible entire clip duration)

**Content**:
- Benefit-focused ("Master These 5 Phrases")
- Question hook ("Why Do Natives Say This?")
- Numbers/specificity ("3 Ways to Close a Deal")

**Example**:
```
"5 Must-Know Business Phrases"
「覚えておくべき5つのビジネスフレーズ」
```

---

### Layer 2: Bilingual Captions (Lower Third)
**Purpose**: Subtitle and sync viewer to actual dialogue

**Position**: Bottom area, lower third (starting ~100px from bottom)
**Layout**:
- English line (above)
- Japanese line (below)
- Center-aligned, stacked vertically

**Typography**:
- English: Medium-large (24-32px), white, readable weight
- Japanese: Slightly smaller (22-28px), white
- Both: Light text shadow (2-4px blur) for readability over video

**Timing**: Synchronized to speech segments (2-5 seconds each)

**Coverage**: Must cover entire clip with no gaps
**Transitions**: Quick fade (0.2-0.5s) between segments

**Content Source**: Clean transcript text, potentially translated for clarity

**Example**:
```
English: "So let's identify your pain points."
Japanese: "では、あなたの問題を特定しましょう。"
(Both displayed simultaneously for 3 seconds)
```

---

### Layer 3: Inline Word Highlights (Japanese Line)
**Purpose**: Draw attention to key vocabulary being taught

**Styling**:
- Color: Gold/yellow (#FFD700 or #FFDD00)
- Weight: Bold
- Underline: Optional subtle underline
- No background fill (text color change only)

**Selection**: 1-3 words per subtitle segment (focus key terms)

**Matching**: Words must exist exactly in Japanese caption text

**Usage**:
- Business terminology (deals, prospects, metrics)
- Idiomatic phrases (pain point, ballpark figure)
- Phrasal verbs and expressions
- Uncommon vocabulary

**Example**:
```
Japanese subtitle: 「では、あなたの問題を特定しましょう。」
Highlights: ["問題"] → appears in gold/yellow
Visual: では、あなたの**問題**を特定しましょう。 (bold gold)
```

---

### Layer 4: Vocabulary Pop-up Cards
**Purpose**: Provide instant definition and context for business phrases

**Trigger**: Appears at specific timestamp (typically when phrase is first mentioned)

**Duration**: 3-4 seconds on screen, then fades out

**Position**: Right side of screen, ~20-30% from top (doesn't block captions)

**Design**:
- Card background: Dark semi-transparent (85-95% opaque)
- Border: Gold/yellow, 2-3px thickness
- Padding: 16-20px internal spacing
- Corner radius: 8-12px
- Shadow: Subtle drop shadow for depth

**Content Sections**:
1. **Category badge** (top-left):
   - Label (e.g. "ビジネス英語", "表現", "スラング")
   - Gold background, black text
   - Small font (10-12px)
   - Pill-shaped (border-radius: 4-6px)

2. **Phrase** (headline):
   - The English expression exactly as spoken
   - Large (22-28px), bold, white
   - Example: "pain point"

3. **Literal translation** (subheading):
   - Word-by-word translation to Japanese
   - Smaller (12-16px), italic, light gray
   - Example: "痛みのポイント"

4. **Nuance/Context** (body):
   - When/how/why to use this phrase
   - Contextual meaning in Japanese
   - 14-18px, gold/yellow, italic
   - Example: "ビジネスで、顧客や事業の問題・課題を指します。営業の場面でよく使われます。"

**Animation**:
- Fade-in: 0.3s, from opacity 0 to 1
- Hold: 3-4 seconds
- Fade-out: 0.3s, from opacity 1 to 0
- Optional: Subtle slide-up (50px) during fade-in

**Example Card**:
```
┌─────────────────────────────┐
│ ビジネス英語                 │
│                             │
│ pain point                  │
│                             │
│ 痛みのポイント              │
│                             │
│ ビジネスで、顧客や事業の    │
│ 問題・課題を指します。      │
│ 営業の場面でよく使用。      │
└─────────────────────────────┘
```

---

### Layer 5: Source Video Background
**Purpose**: Original video content (the foundation)

**Handling**:
- Cropped to specified clip (startTime to endTime)
- May be slightly darkened or color-adjusted to make overlays readable
- No effects, filters, or transitions

**Dimensions**: Must fill 1080x1920 frame (may have letterboxing if source is different aspect ratio)

---

## Timing & Sequencing

### Example Clip Structure (45 seconds)
```
0:00-0:03   | Hook Title appears, video plays with no captions
0:03-0:06   | Caption segment 1 (English + Japanese + highlights)
0:06-0:09   | Caption segment 2 + Vocab Card 1 appears (3s duration)
0:09-0:12   | Caption segment 3
0:12-0:15   | Caption segment 4 + Vocab Card 2 appears
0:15-0:18   | Caption segment 5
0:18-0:21   | Caption segment 6 + Vocab Card 3 appears
0:21-0:24   | Caption segment 7
0:24-0:27   | Caption segment 8
0:27-0:30   | Caption segment 9 + Vocab Card 4 appears
0:30-0:45   | Continued caption segments (vocab cards optional)
```

**Rules**:
- Hook title is persistent (0:00 to end)
- Captions must cover entire clip with <0.5s gaps
- Vocab cards don't overlap each other
- Each card shows 3-4 seconds
- Typically 3-5 cards per 45-60s clip

---

## Color Palette

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Text | White | #FFFFFF | Primary text (English, Japanese captions) |
| Highlights | Gold | #FFD700 | Key vocabulary words, secondary titles |
| Card Background | Dark | rgba(20,20,20,0.95) | Card background (dark, semi-transparent) |
| Card Border | Gold | #FFD700 | Card outline |
| Badge BG | Gold | #FFD700 | Category badge background |
| Badge Text | Black | #000000 | Category badge text |
| Stroke/Shadow | Black | #000000 | Text shadows and outlines |

---

## Key Insights from Reference Format

1. **Contrast is critical**: White text with black stroke makes content readable over any video background
2. **Gold accent color**: Ties together highlights, badges, and secondary text for visual cohesion
3. **Card positioning**: Right side keeps it away from captions (lower third) = no overlap
4. **Animation is subtle**: Fade-in/out and gentle slide-up enhance engagement without being distracting
5. **Dense information**: 3-5 vocab cards in 45-60s = educational value without overwhelming
6. **Persistent hook**: Top title provides content promise throughout entire clip
7. **Bilingual design**: EN above JP mirrors how bilingual learners process content
8. **Highlight restraint**: Only 1-3 words per segment focuses attention on most important vocabulary

---

## Design System Principles

- **Clarity**: Everything must be readable on small phone screens
- **Consistency**: Repeated use of same colors, fonts, spacing builds brand identity
- **Hierarchy**: Title > captions > highlights > cards in importance
- **Economy**: Minimal design, maximal information density
- **Accessibility**: High contrast ratios, readable at 9:16 aspect ratio, no flickering
