---
name: adobe-premiere-editor
description: Automate and control Adobe Premiere Pro for video editing. Script cuts, transitions, effects, color grading, audio mixing, and export workflows. Integrate with your creative tools.
---

# Adobe Premiere Pro Editor

Take control of Adobe Premiere Pro and automate your video editing workflow.

## What It Does

🎬 **Timeline Automation**
- Create and manage sequences
- Import and organize media
- Create cuts and transitions programmatically
- Add effects and adjust parameters
- Render and export projects

✂️ **Editing Operations**
- Batch cut/trim clips
- Apply transitions to all cuts
- Adjust clip properties (duration, position, opacity)
- Create nested sequences
- Build complex timelines automatically

🎨 **Effects & Graphics**
- Add effects to clips
- Adjust effect parameters
- Apply keyframe animations
- Create motion graphics templates
- Apply color grade LUTs

🔊 **Audio Mixing**
- Adjust audio levels
- Apply audio effects
- Mix multiple audio tracks
- Add music and sound effects
- Automate volume curves

📤 **Export Automation**
- Create export presets
- Batch export multiple formats
- Export segments or entire sequence
- Create proxy versions
- Generate thumbnails and contact sheets

## How It Works

### Method 1: ExtendScript (Native Automation)
Direct control of Premiere Pro via JavaScript:
```javascript
// Access Premiere Pro project
const app = require("PremierePro");
const project = app.project;

// Import media
const sequence = project.createNewSequence("MySeq", 1);

// Add clip to timeline
const clip = project.importAEComps(mediaFile)[0];
sequence.videoTracks[0].insertClip(clip, 0);

// Apply effect
const effect = clip.addVideoEffect("Gaussian Blur");
effect.findMatchingProperties("Blur Amount")[0].setValue(50);

// Export
project.exportAAF("output.aaf");
```

### Method 2: REPL Integration
Send commands directly to running Premiere instance:
- Modify timeline in real-time
- See results immediately
- Debug and iterate fast

### Method 3: Project File Manipulation
Edit `.prproj` files directly:
- Parse XML project structure
- Modify timelines, effects, sequences
- Add metadata
- Create variations programmatically

## Common Automation Tasks

### 1. Batch Processing
```
Input: 10 video clips
Process: Cut every 30 seconds, add dissolve transition
Output: Single timeline with all cuts and transitions
```

### 2. Multi-Format Export
```
Input: Finished sequence
Export:
  - YouTube (H.264, 1080p)
  - Instagram (vertical, 1080x1350)
  - Archive (ProRes, master quality)
  - Proxy (half resolution)
```

### 3. Color Grading Batch
```
Input: 50 clips in sequence
Process: Apply cinematic LUT to all
Tweak: Individual primary color corrections
Export: Graded master
```

### 4. Auto-Captioning
```
Input: Video with audio
Process: Extract audio → transcribe → burn-in captions
Output: Sequence with aligned captions
```

### 5. Social Media Versions
```
Input: 16:9 master sequence
Create:
  - 9:16 vertical (Instagram Stories)
  - 1:1 square (Instagram Feed)
  - 4:5 vertical (TikTok)
  - 16:9 (YouTube)
All with proper text/graphic repositioning
```

## Professional Workflows

### Wedding Video Production
```
1. Import raw footage from multiple cameras
2. Sync audio and organize clips by scene
3. Auto-cut clips to beat of music
4. Apply transitions between scenes
5. Add titles and graphics
6. Color grade for consistency
7. Export multiple formats (4K archive, 1080p YouTube, social cuts)
```

### Commercial/Advertisement
```
1. Import client graphics and logo
2. Create variations (different text, colors, music)
3. Apply brand color grade
4. Add legal disclaimers
5. Export each variation
6. Generate preview thumbnails
```

### Podcast/Long-Form Video
```
1. Import raw recording
2. Detect silence and remove gaps
3. Add chapter markers
4. Insert intro/outro graphics
5. Add background music levels
6. Export segments for distribution
```

### YouTube Channel Management
```
1. Import weekly clips
2. Create best-of compilation
3. Add thumbnails and titles
4. Apply consistent color grade
5. Export main + short-form versions
6. Auto-generate timestamps/chapters
```

## Key Features

🔄 **Batch Operations**
- Process multiple projects
- Apply same effects to all clips
- Export multiple formats simultaneously
- Create variations automatically

🎯 **Template System**
- Save editing templates
- Apply to new projects instantly
- Consistent styling across videos
- Brand compliance enforcement

📊 **Project Management**
- Auto-organize footage by date/type
- Create backup versions
- Version control (save snapshots)
- Generate project reports

⚡ **Performance**
- Render queue management
- GPU acceleration
- Cache optimization
- Fast exports using Dynamic Link

## Integration with Your Tools

🎬 Connects perfectly with:
- **cinematic-color-grading** – Apply LUTs to Premiere sequences
- **professional-photo-editor** – Import edited photos as stills
- **instagram-carousel** – Export slides as video sequences
- **remotion** – Import Remotion exports as video tracks
- **elevenlabs-dubbing** – Import dubbed audio automatically

## Scripts Included

📦 **Ready-to-Use Scripts**
```
1. auto-cut-to-beat.jsx
   → Detect music tempo, cut to beat

2. batch-color-grade.jsx
   → Apply LUT to all clips

3. create-social-versions.jsx
   → Generate vertical, square, landscape versions

4. auto-caption.jsx
   → Add hardcoded captions from transcription

5. export-all-formats.jsx
   → MP4, ProRes, DNxHD, DCP

6. cleanup-project.jsx
   → Remove unused media, organize bins

7. sync-multicam.jsx
   → Auto-sync camera angles by timecode

8. generate-preview.jsx
   → Create thumbnails for approval
```

## Learning Path

### Beginner
- Understand Premiere Pro UIs (Project, Timeline, Effects)
- Learn basic ExtendScript syntax
- Run simple scripts

### Intermediate
- Write custom automation scripts
- Understand timecode and frame rates
- Work with complex timelines

### Advanced
- Optimize for performance
- Create custom panels
- Integrate with external tools
- Build production pipelines

## Tips & Best Practices

✅ **Do**
- Save projects before automation
- Test scripts on copies first
- Use version control for scripts
- Document custom automations
- Batch process in off-hours

❌ **Don't**
- Automate without backup
- Use outdated Premiere version
- Rely on third-party plugins for critical tasks
- Ignore render queue warnings
- Export without preview

## System Requirements

- **Adobe Premiere Pro** 2023 or newer
- **ExtendScript Toolkit** (for script editing)
- **Sufficient disk space** (for renders)
- **GPU** (for accelerated processing)
- **Audio devices** (for mixing)

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Script won't run | Check Premiere version, enable ExtendScript |
| Slow renders | Reduce resolution, use proxy clips |
| Export fails | Check codec support, disk space |
| Audio sync issues | Use timecode, verify frame rates |
| Effect not applying | Check layer order, compatibility |

Your complete video editing automation suite! 🎥✨
