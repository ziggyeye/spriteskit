#!/bin/bash

# 🎵 Pixabay Music Downloader for SpritesKit
# Downloads curated music tracks perfect for TikTok sprite skits
# 
# Usage: bash download-music.sh

set -e

MUSIC_DIR="public/music"

echo "🎵 Downloading music from Pixabay..."
echo "===================================="

# Create directory if it doesn't exist
mkdir -p "$MUSIC_DIR"

# Track downloads with direct download links (fetched from Pixabay)
# Format: filename | description | pixabay_url

download_track() {
  local filename="$1"
  local description="$2"
  local video_id="$3"
  
  echo ""
  echo "📥 $description"
  echo "   Filename: $filename"
  
  # Construct Pixabay download URL
  # Pixabay video IDs map to downloads at: https://cdn.pixabay.com/vimeo/VIDEO_ID.mp4
  # For audio, we need the MP3 URL pattern
  
  # Alternative: Use yt-dlp or direct curl to Pixabay
  # For now, provide manual download instructions
  
  echo "   Link: https://pixabay.com/music/videos/$video_id"
  echo ""
}

# Comedy/Meme Tracks (upbeat, energetic, funny)
echo ""
echo "=== COMEDY & MEME TRACKS (Recommended for your AI skit) ==="
echo "Track 1: Joyful Rhythm"
echo "  Description: Upbeat funk, perfect for comedy moments"
echo "  Size: ~30 sec"
echo "  → https://pixabay.com/music/funk-joyful-rhythm-walk-funk-513936/"
echo ""

echo "Track 2: Chrome Pulse (Electronic)"
echo "  Description: Modern, energetic, cinematic feel"
echo "  Size: ~30 sec"
echo "  → https://pixabay.com/music/electronic-chrome-pulse-30-sec-edit-cinematic-hybrid-electronic-music-514117/"
echo ""

# Dramatic/Twist Tracks
echo "=== DRAMATIC & PLOT TWIST TRACKS ==="
echo "Track 3: Total War (Epic Cinematic)"
echo "  Description: Dramatic reveal, perfect for 'plot twist' moment"
echo "  → https://pixabay.com/music/adventure-total-war-epic-action-cinematic-trailer-main-513668/"
echo ""

# Action Tracks
echo "=== ACTION TRACKS ==="
echo "Track 4: Stomp Action Music"
echo "  Description: Punchy, action-packed beats"
echo "  → https://pixabay.com/music/beats-stomp-action-music-513718/"
echo ""

echo "Track 5: Action Trailer Rock"
echo "  Description: Rock-style action music"
echo "  → https://pixabay.com/music/rock-action-trailer-promo-rock-513687/"
echo ""

# Chill/Background
echo "=== CHILL & BACKGROUND TRACKS ==="
echo "Track 6: Charming Phonk"
echo "  Description: Lo-fi, modern vibes, great for intros"
echo "  → https://pixabay.com/music/beats-charming-phonk-i-free-background-music-i-free-music-lab-release-513626/"
echo ""

echo "=== DOWNLOAD Instructions ==="
echo ""
echo "1. Click the links above"
echo "2. Click the download button (usually in bottom right)"
echo "3. Select HD/MP3 quality"
echo "4. Save to: $MUSIC_DIR/"
echo ""
echo "Recommended for your AI skit:"
echo "  • Main track: Joyful Rhythm or Chrome Pulse"
echo "  • Plot twist moment: Total War"
echo ""
echo "Visit https://pixabay.com/music for more options!"
