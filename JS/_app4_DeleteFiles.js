const fs = require('fs');
const path = require('path');

function deleteFilesWithExtension(dir, extension) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isFile() && file.endsWith(extension)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${file}`);
    }
  });
}

const directoryPath = '../.logs';
const extension = '.log_BEF.log';
deleteFilesWithExtension(directoryPath, extension);