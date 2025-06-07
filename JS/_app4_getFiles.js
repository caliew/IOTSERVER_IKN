const fs = require('fs');
const path = require('path');

function getFilesInDirectory(dir) {
  const files = [];
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isFile()) {
      files.push(file);
    }
  });
  const json = JSON.stringify({ filenames: files }, null, 2);
  fs.writeFileSync('_app4_getFiles.json', json);
}

const directoryPath = '../.logs';
getFilesInDirectory(directoryPath);