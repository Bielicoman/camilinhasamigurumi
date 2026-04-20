---
name: elevenlabs-tts
description: Convert text to speech with natural-sounding voices using ElevenLabs. Perfect for creating voiceovers, narration, and audio content.
---

# ElevenLabs Text-to-Speech

Generate high-quality audio from text using ElevenLabs' advanced TTS engine.

## Features

- **Natural voices** – Choose from 100+ pre-built voices or create custom ones
- **Multiple languages** – Support for 29+ languages
- **Voice customization** – Adjust stability, clarity, and speaking style
- **Real-time streaming** – Get audio as it's generated

## Common Use Cases

- Creating video voiceovers
- Generating narration for presentations
- Building audio-based applications
- Dubbing and localization

## Setup

Requires ElevenLabs API key. Get one at https://elevenlabs.io

## API Integration

```javascript
const ElevenLabs = require("elevenlabs");

const client = new ElevenLabs({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

const audio = await client.textToSpeech.convert({
  voice_id: "21m00Tcm4TlvDq8ikWAM", // Rachel
  text: "Hello world!",
});
```
