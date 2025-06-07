const fs = require('fs');
const path = require('path');

const currentDirectory = process.cwd(); // Get the current working directory

// Declare the app
const app = {};
const fileData = {}; // Initialize an empty object to store file data

// Load configuration from _app1.json
const configFilePath = '_app1.json';
const configFileContent = fs.readFileSync(configFilePath, 'utf8');
const config = JSON.parse(configFileContent);


app.extract = async function() {
  const filePaths = config.filesnames.map(filename => path.join(config.path, `${filename}${config.fileExtension}`));

  for (const filePath of filePaths) {
    // READ FILE TO DO SPLIT
    try {
      const data = await fs.promises.readFile(filePath, 'utf8');

      // Convert data to array of objects
      const lines = data.trim().split('\n');
      const fileDataObjects = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (error) {
          console.error('Error parsing JSON:', error);
          return null;
        }
      });

      // Split data into BEF and AFT
      const _splitDate = new Date(config.splitDate);
      const objArr1 = [];
      const objArr2 = [];
      fileDataObjects.forEach(object => {
        if (object) {
          const dateTime = new Date(object.TIMESTAMP);
          if (dateTime < _splitDate) {
            objArr1.push(object);
          } else {
            objArr2.push(object);
          }
        }
      });

      // Create output file paths
      const outputFilePath1 = `${filePath}_BEF.log`;
      const outputFilePath2 = `${filePath}_${config.splitDate}.log`;

      // Write data to output files
      await app.appendFile(objArr1, outputFilePath2, () => {console.log(`Finished writing to ${outputFilePath1}`);});
      await app.appendFile(objArr2, outputFilePath1, () => {console.log(`Finished writing to ${outputFilePath2}`);});
      app.replaceOriginalFileWithAFT(filePath, outputFilePath1);
    } catch (err) {
      console.error('Error reading file:', err);
    }
  }
};


// Function to append data to file
app.appendFile = async function(_arrayOfObjects, _outputFilePath, callback) {
  await fs.promises.writeFile(_outputFilePath, '', 'utf8');
  await app.writeObjectToFile(_arrayOfObjects, _outputFilePath, 0, callback);
};

// Function to write object to file
app.writeObjectToFile = async function(_arrayOfObjects, _outputFilePath, index, callback) {
  if (index >= _arrayOfObjects.length) {
    await fs.promises.appendFile(_outputFilePath, '\n', 'utf8');
    callback(); // Call the callback function
    return;
  }

  const jsonObject = _arrayOfObjects[index];
  const jsonLine = `${JSON.stringify(jsonObject)}\n`;

  await fs.promises.appendFile(_outputFilePath, jsonLine, 'utf8');
  await app.writeObjectToFile(_arrayOfObjects, _outputFilePath, index + 1, callback); // Write the next object

};

// Function to replace original file with _AFT file
app.replaceOriginalFileWithAFT = function(originalFilePath, aftFilePath) {
  fs.readFile(aftFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
    } else {
      fs.writeFile(originalFilePath, data, 'utf8', (err) => {
        if (err) {
          console.error('Error writing to file:', err);
        } else {
          fs.unlink(aftFilePath, (err) => {
            if (err) {
              console.error('Error deleting file:', err);
            } else {
              console.log(`Original file replaced with _AFT file: ${originalFilePath}`);
            }
          });
        }
      });
    }
  });
};

// Self-executing function
app.extract();

// Export the app
module.exports = app;