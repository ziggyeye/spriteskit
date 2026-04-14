#!/bin/bash

# 🎤 Voice Generation Helper Script
# Run this before rendering to pre-generate all voice audio files
# 
# Usage: bash generate-voices.sh

echo "🎤 Voice Generation for SpritesKit"
echo "===================================="
echo ""

# Check if ElevenLabs API key is set
if [ -z "$ELEVENLABS_API_KEY" ]; then
  if [ -z "$ELEVEN_LABS_API_KEY" ]; then
    echo "❌ Error: ELEVENLABS_API_KEY not set in .env"
    echo "   Get a free API key from: https://elevenlabs.io"
    echo "   Add to .env: ELEVENLABS_API_KEY=sk_..."
    exit 1
  fi
fi

echo "✓ API key found"
echo ""
echo "📝 Edit the dialogue lines in 'generate-voices-config.json'"
echo "   Then run: npm run generate-voices"
echo ""
echo "🎵 Music setup:"
echo "   1. Visit: https://pixabay.com/music"
echo "   2. Search: upbeat, comedy, cinematic, etc."
echo "   3. Download MP3 files"
echo "   4. Place in: public/music/"
echo ""
echo "Done! Ready to render."
