const fs = require('fs');
const path = require('path');

const currentDirectory = process.cwd(); // Get the current working directory

// Declare the app
const app = {};
const fileData = {}; // Initialize an empty object to store file data
// ------------------
const splitDate = '2023-02-13';
const filePath = 'B0-68-61-5E-F9-72.log';
// -------------
// Init function
app.writeObjectToFile = function(_arrayOfObjects,_outputFilePath,index) {
  if (index >= _arrayOfObjects.length) {
    console.log('All objects have been written to', _outputFilePath);
    return;
  }
  const jsonObject = _arrayOfObjects[index];
  const jsonObjectString = JSON.stringify(jsonObject); // The `null` and `2` arguments are for formatting (indentation)
  // Append a comma and newline for all but the last object
  const separator = index === _arrayOfObjects.length - 1 ? '' : '\n';
  fs.appendFile(_outputFilePath, jsonObjectString + separator, 'utf8', (err) => {
    if (err) {
      console.error('Error writing to file:', err);
    } else {
      app.writeObjectToFile(_arrayOfObjects,_outputFilePath,index + 1,); // Write the next object
    }
  });
}
// -------------------
app.extract = function (splitDate) {
  // --------
  let _splitDate = new Date(splitDate);
  console.log('.. . . . . . ..');
  console.log('.. UTILITIES ..');
  console.log('.. DIRECTORY \t',currentDirectory);
  console.log('.. SPLIT DATE \t',_splitDate)
  // ---------------------------------------------
  // READ CURRENT DIRECTORY GET DIRECTORY FILE MAP
  // ---------------------------------------------
  fs.readdir(currentDirectory, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return;
    }  
    files.forEach((file) => {
      fs.stat(file, (err, stats) => {
        if (err) {
          console.error('Error getting file stats:', err);
          return;
        };
        fileData[file] = stats.size;
        // Check if all files have been processed and log the result
        if (Object.keys(fileData).length === files.length) {
          console.log(`.. TOTAL FILES IN DIRECTORY : <${Object.keys(fileData).length}>`);
        }
      });
    });
  });
  // ---------------------
  // READ FILE TO DO SPLIT
  // ---------------------
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }
    // -----------------------------------
    const lines = data.trim().split('\n');
    let objArr1 = [];
    let objArr2 = [];
    // --------------
    const fileDataObjects = lines.map((line) => {
      try {
        let JSONObject = JSON.parse(line)
        let dateTime = new Date(JSONObject.TIMESTAMP);
        if (dateTime < _splitDate) objArr1.push(JSONObject)
        else objArr2.push(JSONObject);
        return JSONObject;
      } catch (error) {
        console.error('Error parsing JSON:', error);
        return null;
      }
    });
    // ------------------------------
    let Object1 = fileDataObjects[0];
    let Object2 = fileDataObjects[fileDataObjects.length-1];
    let dateTime1 = new Date(Object1.TIMESTAMP);
    let dateTime2 = new Date(Object2.TIMESTAMP);
    // -----------------------------------------
    console.log('  ..LOG FILE READ : \t',filePath);
    console.log(`  ..[${dateTime1.toLocaleDateString()}]|MONTH[${dateTime1.getMonth()+1}] > [${dateTime2.toLocaleDateString()}]|MONTH[${dateTime2.getMonth()+1}]`)
    console.log(`  ..ARRAY1 [${objArr1.length}] ..ARRAY2 [${objArr2.length}]`);
    // Convert the array of objects to a JSON string
    const jsonArrayString1 = JSON.stringify(objArr1, null, 2); // The `null` and `2` arguments are for formatting (indentation)
    const jsonArrayString2 = JSON.stringify(objArr2, null, 2); // The `null` and `2` arguments are for formatting (indentation)
    // Specify the path for the output JSON file
    const outputFilePath1 = '_splitBEF.log'; // Replace with your desired output file path
    const outputFilePath2 = '_splitAFT.log'; // Replace with your desired output file path
    // ---------------------------------
    // Write the JSON string to the file
    app.appendFile(objArr1,outputFilePath1);
    app.appendFile(objArr2,outputFilePath2);
    // --------    
  });
};
app.appendFile = function(_arrayOfObjects,_outputFilePath) {
  fs.writeFile(_outputFilePath, '', 'utf8', (err) => {
    if (err) {
      console.error('Error writing to file:', err);
    } else {
      app.writeObjectToFile(_arrayOfObjects,_outputFilePath,0); // Start writing objects
    }
  });  
}
// -----
// Self executing
app.extract(splitDate);

// Export the app
module.exports = app;