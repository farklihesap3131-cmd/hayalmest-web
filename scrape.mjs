import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const urlsToScrape = [
  'https://www.hayalmest.com',
  'https://www.hayalmest.com/anasayfa',
  'https://www.hayalmest.com/menu',
  'https://www.hayalmest.com/sanatçı-takvimi',
  'https://www.hayalmest.com/anılar',
  'https://www.hayalmest.com/iletişim',
];

const assetsDir = path.join(__dirname, 'public', 'assets');
const imgDir = path.join(assetsDir, 'images');
const vidDir = path.join(assetsDir, 'videos');

if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
if (!fs.existsSync(vidDir)) fs.mkdirSync(vidDir, { recursive: true });

const downloadedUrls = new Set();

async function downloadFile(url, folder) {
  if (downloadedUrls.has(url)) return;
  downloadedUrls.add(url);
  try {
    let ext = path.extname(new URL(url).pathname);
    if (!ext) ext = folder === imgDir ? '.jpg' : '.mp4';
    const filename = path.basename(new URL(url).pathname) || `asset_${Date.now()}${ext}`;
    const dest = path.join(folder, filename);

    if (fs.existsSync(dest)) return;

    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(dest);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    console.log(`Downloaded: ${filename}`);
  } catch (error) {
    console.error(`Failed to download ${url}:`, error.message);
  }
}

async function scrape() {
  console.log('Starting scrape...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // To handle Wix or React based SPAs properly, we wait for network idle
  for (const url of urlsToScrape) {
    try {
      console.log(`Navigating to ${url}...`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      
      // Extract images
      const images = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs.map(img => img.src).filter(src => src && src.startsWith('http'));
      });

      // Extract videos
      const videos = await page.evaluate(() => {
        const vids = Array.from(document.querySelectorAll('video, source'));
        return vids.map(v => v.src).filter(src => src && src.startsWith('http'));
      });

      // Also get any inline styles with background-image
      const bgImages = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const urls = [];
        for (const el of elements) {
          const bg = window.getComputedStyle(el).backgroundImage;
          if (bg && bg.includes('url(')) {
            const match = bg.match(/url\(['"]?(.*?)['"]?\)/);
            if (match && match[1] && match[1].startsWith('http')) {
              urls.push(match[1]);
            }
          }
        }
        return urls;
      });

      const allImages = [...new Set([...images, ...bgImages])];
      const allVideos = [...new Set(videos)];

      for (const imgUrl of allImages) {
        // Many platforms append query strings or use a specific format for images, let's keep it simple
        let cleanUrl = imgUrl;
        if(cleanUrl.includes('wixstatic.com/media/')) {
          cleanUrl = cleanUrl.split('/v1/')[0]; // Attempt to get original wix image
        }
        await downloadFile(cleanUrl, imgDir);
      }

      for (const vidUrl of allVideos) {
        await downloadFile(vidUrl, vidDir);
      }
      
    } catch (e) {
      console.error(`Error scraping ${url}:`, e.message);
    }
  }

  await browser.close();
  console.log('Scraping completed.');
}

scrape().catch(console.error);
