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

// Function to extract data from files
app.extract = function() {
  const filePaths = config.filesnames.map(filename => path.join(config.path, `${filename}${config.fileExtension}`));

  filePaths.forEach(filePath => {
    // READ FILE TO DO SPLIT
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading file:', err);
        return;
      }

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
      const outputFilePath2 = `${filePath}_AFT.log`;

      // Write data to output files
      app.appendFile(objArr1, outputFilePath1);
      app.appendFile(objArr2, outputFilePath2);
    });
  });
};

// Function to append data to file
app.appendFile = function(_arrayOfObjects, _outputFilePath) {
  fs.writeFile(_outputFilePath, '', 'utf8', (err) => {
    if (err) {
      console.error('Error writing to file:', err);
    } else {
      app.writeObjectToFile(_arrayOfObjects, _outputFilePath, 0); // Start writing objects
    }
  });
};

// Function to write object to file
app.writeObjectToFile = function(_arrayOfObjects, _outputFilePath, index) {
  if (index >= _arrayOfObjects.length) {
    console.log('All objects have been written to', _outputFilePath);
    return;
  }

  const jsonObject = _arrayOfObjects[index];
  const jsonObjectString = JSON.stringify(jsonObject, null, 2); // The `null` and `2` arguments are for formatting (indentation)
  const separator = index === _arrayOfObjects.length - 1 ? '' : '\n';

  fs.appendFile(_outputFilePath, jsonObjectString + separator, 'utf8', (err) => {
    if (err) {
      console.error('Error writing to file:', err);
    } else {
      app.writeObjectToFile(_arrayOfObjects, _outputFilePath, index + 1); // Write the next object
    }
  });
};

// Self-executing function
app.extract();

// Export the app
module.exports = app;