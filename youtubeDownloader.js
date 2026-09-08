const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');
const { randomUUID } = require('crypto');
const vreden = require('@vreden/youtube_scraper');

function getThumb(thumb) {
  return thumb || 'https://i.ibb.co/pRKvYt1/default-thumb.jpg';
}

function ensureTempDir() {
  const tempDir = path.join(tmpdir(), 'youtube-dl');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

// Méthode principale : le paquet npm directement (pas de serveur intermédiaire qui peut tomber)
async function fetchVredenPackage(url, type = 'mp3') {
  const result = type === 'mp3' ? await vreden.ytmp3(url) : await vreden.ytmp4(url);
  if (!result?.status || !result?.download) {
    throw new Error(`Vreden package failed: ${JSON.stringify(result?.result || 'unknown error')}`);
  }
  return {
    download_url: result.download,
    original_filename: `${result.metadata?.title || 'video'}.${type === 'mp3' ? 'mp3' : 'mp4'}`.replace(/[<>:"/\\|?*]/g, ''),
    title: result.metadata?.title || 'video',
    thumbnail: result.metadata?.thumbnail || result.metadata?.image,
    source: 'vreden-pkg'
  };
}

async function fetchVreden(url, type = 'mp3') {
  const endpoint = type === 'mp3'
    ? 'https://api.vreden.my.id/api/ytmp3'
    : 'https://api.vreden.my.id/api/ytmp4';

  try {
    const { data } = await axios.get(endpoint, { params: { url }, timeout: 60000 });
    if (!data?.result?.status) throw new Error(`Vreden API failed`);
    
    const { metadata, download } = data.result;
    if (!download?.url) throw new Error('Download URL not found');
    
    return {
      download_url: download.url,
      original_filename: download.filename,
      title: metadata.title || 'video',
      thumbnail: metadata.thumbnail || metadata.image,
      source: 'vreden'
    };
  } catch (error) { throw error; }
}

async function fetchKyyOkatsu(url, type = 'mp3') {
  const endpoint = type === 'mp3'
    ? 'https://kyyokatsurestapi.my.id/downloader/ytmp3'
    : 'https://kyyokatsurestapi.my.id/downloader/ytmp4';

  try {
    const { data } = await axios.get(endpoint, { params: { url }, timeout: 30000 });
    if (!data?.status) throw new Error(`KyyOkatsu API failed`);
    
    if (type === 'mp3') {
      if (!data.dl) throw new Error('Download URL not found');
      return {
        download_url: data.dl,
        original_filename: `${data.title}.mp3`.replace(/[<>:"/\\|?*]/g, ''),
        title: data.title,
        thumbnail: data.thumb,
        source: 'kyyokatsu'
      };
    } else {
      if (!data.result?.mp4) throw new Error('Download URL not found');
      return {
        download_url: data.result.mp4,
        original_filename: `${data.result.title}.mp4`.replace(/[<>:"/\\|?*]/g, ''),
        title: data.result.title,
        thumbnail: data.thumb,
        source: 'kyyokatsu'
      };
    }
  } catch (error) { throw error; }
}

async function fetchKord(url, type = 'mp3') {
  try {
    if (type === 'mp3') {
      const { data } = await axios.get('https://api.kord.live/api/yt-song', { params: { url }, timeout: 30000 });
      if (!data?.success || !data?.url) throw new Error('Kord MP3 response invalid');
      
      return {
        download_url: data.url,
        original_filename: `${data.title}.mp3`.replace(/[<>:"/\\|?*]/g, ''),
        title: data.title,
        thumbnail: data.thumbnail,
        source: 'kord'
      };
    } else {
      const { data } = await axios.get('https://api.kord.live/api/ytdl', { params: { url }, timeout: 30000 });
      if (!data?.videos?.length) throw new Error('Kord MP4 response invalid');
      
      const video = data.videos.find(v => v.urls?.find(u => u)) || data.videos[0];
      const validUrl = video.urls.find(u => u);
      
      return {
        download_url: validUrl,
        original_filename: video.fileName.replace(/[<>:"/\\|?*]/g, ''),
        title: data.title,
        thumbnail: null,
        source: 'kord'
      };
    }
  } catch (error) { throw error; }
}

async function fetchDownloadUrl(url, type = 'mp3') {
  try { return await fetchVredenPackage(url, type); }
  catch (e0) {
    console.error("Vreden package failed, falling back:", e0.message);
    try { return await fetchVreden(url, type); }
    catch (e1) {
      try { return await fetchKyyOkatsu(url, type); }
      catch (e2) { return await fetchKord(url, type); }
    }
  }
}

async function downloadFile(url, outputPath) {
  const response = await axios({ method: 'GET', url, responseType: 'stream', timeout: 60000 });
  const writer = fs.createWriteStream(outputPath);
  response.data.pipe(writer);
  
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
    response.data.on('error', reject);
  });
}

async function getYTAudioCompressed(url) {
  let tempInputPath, tempOutputPath;
  try {
    const { download_url, original_filename, title, thumbnail, source } = await fetchDownloadUrl(url, 'mp3');
    const tempDir = ensureTempDir();
    const uniqueId = randomUUID().substring(0, 8);
    
    const sanitizedFilename = original_filename.replace(/[<>:"/\\|?*]/g, '');
    tempInputPath = path.join(tempDir, `input_${uniqueId}_${sanitizedFilename}`);
    tempOutputPath = path.join(tempDir, `output_${uniqueId}_${sanitizedFilename}`);
    
    await downloadFile(download_url, tempInputPath);
    
    if (source === 'vreden' || source === 'vreden-pkg') {
      await new Promise((resolve, reject) => {
        ffmpeg(tempInputPath)
          .audioCodec('libmp3lame')
          .audioBitrate('64k')
          .audioFrequency(44100)
          .audioChannels(2)
          .format('mp3')
          .outputOptions(['-preset veryfast', '-y'])
          .on('end', resolve)
          .on('error', reject)
          .save(tempOutputPath);
      });
    } else { tempOutputPath = tempInputPath; }
    
    return { buffer: fs.readFileSync(tempOutputPath), filename: original_filename, title, thumbnail, source };
  } finally {
    if (tempInputPath && fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
    if (tempOutputPath && fs.existsSync(tempOutputPath) && tempOutputPath !== tempInputPath) {
      fs.unlinkSync(tempOutputPath);
    }
  }
}

async function getYTVideoCompressed(url) {
  let tempInputPath, tempOutputPath;
  try {
    const { download_url, original_filename, title, thumbnail, source } = await fetchDownloadUrl(url, 'mp4');
    const tempDir = ensureTempDir();
    const uniqueId = randomUUID().substring(0, 8);
    
    const sanitizedFilename = original_filename.replace(/[<>:"/\\|?*]/g, '');
    tempInputPath = path.join(tempDir, `input_${uniqueId}_${sanitizedFilename}`);
    tempOutputPath = path.join(tempDir, `output_${uniqueId}_${sanitizedFilename}`);
    
    await downloadFile(download_url, tempInputPath);
    
    if (source === 'vreden' || source === 'vreden-pkg') {
      await new Promise((resolve, reject) => {
        ffmpeg(tempInputPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .videoBitrate('300k')
          .audioBitrate('96k')
          .size('640x360')
          .format('mp4')
          .outputOptions(['-preset veryfast', '-crf 32', '-movflags +faststart', '-y'])
          .on('end', resolve)
          .on('error', reject)
          .save(tempOutputPath);
      });
    } else { tempOutputPath = tempInputPath; }
    
    return { buffer: fs.readFileSync(tempOutputPath), filename: original_filename, title, thumbnail, source };
  } finally {
    if (tempInputPath && fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
    if (tempOutputPath && fs.existsSync(tempOutputPath) && tempOutputPath !== tempInputPath) {
      fs.unlinkSync(tempOutputPath);
    }
  }
}

module.exports = { getYTAudioCompressed, getYTVideoCompressed, getThumb };