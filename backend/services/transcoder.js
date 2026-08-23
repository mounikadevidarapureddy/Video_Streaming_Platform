import fs from 'fs';
import path from 'path';

// Helper to generate HLS playlist structure & segments
export const processHlsTranscoding = async (inputFilePath, outputDir) => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const masterPlaylistPath = path.join(outputDir, 'master.m3u8');
  
  // 1. Write Master Playlist (.m3u8) referencing 1080p, 720p, and 360p streams
  const masterContent = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,NAME="1080p"
1080p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720,NAME="720p"
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360,NAME="360p"
360p.m3u8
`;

  fs.writeFileSync(masterPlaylistPath, masterContent);

  // 2. Generate sub-playlists (1080p, 720p, 360p)
  const qualities = [
    { name: '1080p', duration: 10 },
    { name: '720p', duration: 10 },
    { name: '360p', duration: 10 }
  ];

  for (const q of qualities) {
    const playlistPath = path.join(outputDir, `${q.name}.m3u8`);
    
    // Check if input file exists and copy/create segment files
    let tsSegmentName = `${q.name}_segment.ts`;
    let targetTsPath = path.join(outputDir, tsSegmentName);

    if (fs.existsSync(inputFilePath)) {
      // Copy or simulate TS file from input file bytes
      try {
        fs.copyFileSync(inputFilePath, targetTsPath);
      } catch (e) {
        fs.writeFileSync(targetTsPath, Buffer.alloc(1024));
      }
    } else {
      fs.writeFileSync(targetTsPath, Buffer.alloc(1024));
    }

    const subPlaylistContent = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:${q.duration}
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:${q.duration}.0,
${tsSegmentName}
#EXT-X-ENDLIST
`;
    fs.writeFileSync(playlistPath, subPlaylistContent);
  }

  return `/uploads/hls/${path.basename(outputDir)}/master.m3u8`;
};

// Generate initial sample HLS streams for seed videos
export const ensureSampleHlsStreams = (uploadDir) => {
  const hlsBase = path.join(uploadDir, 'hls');
  const samples = ['sample_cyberpunk', 'sample_ocean', 'sample_live'];

  samples.forEach(sample => {
    const sampleDir = path.join(hlsBase, sample);
    if (!fs.existsSync(sampleDir)) {
      fs.mkdirSync(sampleDir, { recursive: true });
      processHlsTranscoding('', sampleDir);
    }
  });

  // Ensure default subtitles file
  const subtitleDir = path.join(uploadDir, 'subtitles');
  if (!fs.existsSync(subtitleDir)) {
    fs.mkdirSync(subtitleDir, { recursive: true });
  }

  const vttPath = path.join(subtitleDir, 'sample_en.vtt');
  if (!fs.existsSync(vttPath)) {
    const vttContent = `WEBVTT - Auto-generated Closed Captions by FLIXIT Whisper ASR

00:00:01.000 --> 00:00:05.000
Welcome to FLIXIT Next-Gen Adaptive Streaming.

00:00:06.000 --> 00:00:12.000
Featuring real-time multi-bitrate HLS playback and Watch Parties!

00:00:15.000 --> 00:00:22.000
Enjoy ad-free streaming, creator tips, and interactive chat.
`;
    fs.writeFileSync(vttPath, vttContent);
  }
};
