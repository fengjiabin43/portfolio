const https = require('https');
const fs = require('fs');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

Promise.all([
  download('https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/WPS_Office_logo.png/1200px-WPS_Office_logo.png', 'public/wps.png'),
  download('https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Shein_logo.svg/1200px-Shein_logo.svg.png', 'public/shein.png'),
  download('https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/NetEase_logo.svg/1200px-NetEase_logo.svg.png', 'public/netease.png')
]).then(() => console.log('All downloads finished successfully.')).catch(err => {
  console.error('Download failed:', err);
  process.exit(1);
});
