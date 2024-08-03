#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
var colors = require('colors');

// FILE READ ---------
let filepath;
let absolutePath;
let fileContent = '';
const beforeDate = [];
const afterDate = [];
let dateSET;
let paramSET;
let filterSET = {}; // Change filterSET to an object to hold key-value pairs
// --------
// COMMANDS
// --------
const COMMANDS = [
  { command: 'SETFILE filename', description: 'Read a file and store its content.' },
  { command: 'SETDATE mm-dd-yyyy', description: 'Set a date for the file content.' },
  { command: 'INFO', description: 'Get the first line of the file and convert it to an object.' },
  { command: 'LIST', description: 'List the file content summary.' },
  { command: 'LIST n1', description: 'List the file content of line n1.' },
  { command: 'LIST n1 n2', description: 'List the file content from line n1 to n2.' },
  { command: 'DATE', description: 'List the SETDATE' },
  { command: 'COPY', description: 'Duplicate the file and create a new file with "_COPY" appended to the filename.' },
  { command: 'DELETE n1 n2', description: 'Delete lines from the file content between two specified line numbers.' },
  { command: 'SETFILTER filter=id', description: 'Set the KEY and VALUE to filter lines.' },
  { command: 'SETPARAM param', description: 'Set the KEY as parameters for SCAN.' },
  { command: 'SAVE', description: 'Save the modified content back to the original file.' },
  { command: 'SAVE BEF', description: 'Save the BEFORE BREAK POINT to the NEW FILE.' },
  { command: 'SAVE AFT', description: 'Save the AFTER  BREAK POINT to the NEW FILE.' },
  { command: 'HELP', description: 'List all available commands.' }
];
// ------------------
// READLINE INTERFACE
// ------------------
const readLine = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'FILE-APP> '.yellow,
  terminal: false
});
const outputResponse = (text) => {
  console.log('          '+String(text).green);
}
readLine.prompt();
// ----------------------------
readLine
  .on('line', (input) => {
    // ----------------------------------
    const args = input.trim().split(' ');
    const command = args[0].toUpperCase();    
    // ----------------------------------
    switch (command) {
      case 'SETFILE':
        if (args[1]) {
          filepath = args[1];
          absolutePath = path.resolve(filepath);
          fs.readFile(absolutePath, 'utf8', (err, data) => {
            if (err) {
              outputResponse(`Error reading file from disk: ${err}`);
            } else {
              fileContent = data;
              outputResponse(`${args[1]} READ SUCCESSFULLY`);
            }
            readLine.prompt(); // Display the prompt again
          });
        } else {
          console.log('File path not provided.');
          readLine.prompt(); // Display the prompt again
        }
        break;
      case 'DELETE':
        if (fileContent) {
          const lines = fileContent.split('\n');
          if (args[1]) {
            const N1 = parseInt(args[1], 10);
            const N2 = args[2] ? parseInt(args[2], 10) : N1; // Use N1 as N2 if only N1 is provided
            let hide = args[3] === 'HIDE'; // Check if the third input is 'HIDE'
            if (!isNaN(N1) && !isNaN(N2) && N1 <= N2 && N1 > 0) {
              const maxLines = lines.length;
              if (N2 > maxLines) {
                outputResponse(`N2 exceeds the total number of lines (${maxLines}). Setting N2 to ${maxLines}.`);
                N2 = maxLines; // Adjust N2 to the max line count
              }
              // Delete lines from N1 to N2 (inclusive)
              const deletedLines = lines.slice(N1 - 1, N2).join('\n');
              fileContent = lines.slice(0, N1 - 1).concat(lines.slice(N2)).join('\n');
              // If not hiding, show the deleted lines
              if (!hide) {
                outputResponse(`Deleted lines ${N1} to ${N2}:\n${deletedLines}`);
              } else {
                outputResponse(`Deleted lines from ${N1} to ${N2} (hidden).`);
              }
              // Display the updated total line count after deletion
              const updatedLineCount = fileContent.split('\n').length;
              outputResponse(`Total lines after deletion: ${updatedLineCount}`);
            } else {
              outputResponse(`INVALID LINE RANGE : ${N1} to ${N2}`);
            }
          } else {
            console.log('Line numbers not provided correctly.');
          }
        } else {
          outputResponse('No file content stored.');
        }
        readLine.prompt(); // Display the prompt again
        break;
      case 'COPY':
        if (fileContent) {
          const dirname = path.dirname(absolutePath);
          const extname = path.extname(absolutePath);
          const basename = path.basename(absolutePath, extname);
          const copyPath = path.join(dirname, `_COPY_${basename}${extname}`);
          fs.writeFile(copyPath, fileContent, 'utf8', (err) => {
            if (err) {
              outputResponse(`Error writing copy file: ${err}`);
            } else {
              outputResponse(`File copied to: ${copyPath}`);
            }
            readLine.prompt(); // Display the prompt again
          });
        } else {
          outputResponse('No file content stored.');
          readLine.prompt(); // Display the prompt again
        }
        break;
      case 'SAVE':
        if (args[1]) {
          const command = args[1].toUpperCase(); // Get the command after SAVE
          switch (command) {
            case 'BEF':
              if (beforeDate.length > 0) {
                const basename = path.basename(absolutePath, path.extname(absolutePath));
                const beforeFilePath = path.join(path.dirname(absolutePath), `${basename}_BEF.log`);
                fs.writeFile(beforeFilePath, beforeDate.join('\n'), 'utf8', (err) => {
                  if (err) {
                    outputResponse(`Error saving BEF file: ${err}`);
                  } else {
                    outputResponse(`BEF file saved successfully: ${beforeFilePath}`);
                  }
                  readLine.prompt(); // Display the prompt again after saving
                });
              } else {
                outputResponse('No content in beforeDate to save.');
                readLine.prompt(); // Display the prompt again if there's nothing to save
              }
              break;
            case 'AFT':
              if (afterDate.length > 0) {
                const basename = path.basename(absolutePath, path.extname(absolutePath));
                const afterFilePath = path.join(path.dirname(absolutePath), `${basename}_AFT.log`);
                fs.writeFile(afterFilePath, afterDate.join('\n'), 'utf8', (err) => {
                  if (err) {
                    outputResponse(`Error saving AFT file: ${err}`);
                  } else {
                    outputResponse(`AFT file saved successfully: ${afterFilePath}`);
                  }
                  readLine.prompt(); // Display the prompt again after saving
                });
              } else {
                outputResponse('No content in afterDate to save.');
                readLine.prompt(); // Display the prompt again if there's nothing to save
              }
              break;
            default: // Save the current edited fileContent
              if (fileContent) {
                fs.writeFile(absolutePath, fileContent, 'utf8', (err) => {
                  if (err) {
                    outputResponse(`Error saving file: ${err}`);
                  } else {
                    outputResponse(`File saved successfully: ${absolutePath}`);
                  }
                  readLine.prompt(); // Display the prompt again after saving
                });
              } else {
                outputResponse('No file content to save.');
                readLine.prompt(); // Display the prompt again if there's nothing to save
              }
              break;
          }
        } else {
          // If no input after SAVE command, treat it as a request to save the current file
          if (fileContent) {
            fs.writeFile(absolutePath, fileContent, 'utf8', (err) => {
              if (err) {
                outputResponse(`Error saving file: ${err}`);
              } else {
                outputResponse(`File saved successfully: ${absolutePath}`);
              }
              readLine.prompt(); // Display the prompt again after saving
            });
          } else {
            outputResponse('No file content to save.');
            readLine.prompt(); // Display the prompt again if there's nothing to save
          }
        }
        break;
      case 'SETDATE':
        if (args[1]) {
          dateSET = new Date(args[1]);
          outputResponse(`Date set to: ${dateSET}`);
        }
        readLine.prompt(); // Display the prompt again
        break;
      case 'SETPARAM':
        if (args[1]) {
          paramSET = args[1];
          convertHex = args[2] && args[2].toUpperCase() === 'HEX'; // Check if HEX keyword is present
          outputResponse(`Parameter set to: ${paramSET} ${convertHex ? '(Hexadecimal)' : ''}`);
        } else {
          outputResponse('Please provide a parameter to set.');
        }
        readLine.prompt();
        break;
      case 'SETFILTER':
        if (args[1]) {
          if (args[1].toUpperCase() === 'NULL') {
            filterSET = null; // Reset filter
            outputResponse('Filter has been reset to NULL.');
          } else {
            const filterParts = args[1].split('='); // Expecting a format like key=value
            if (filterParts.length === 2) {
              const key = filterParts[0].trim();
              const value = filterParts[1].trim();
              filterSET = { [key]: value }; // Set new filter
              outputResponse(`Filter set to: ${key} = ${value}`);
            } else {
              outputResponse('Invalid filter format. Use key=value or NULL to reset.');
            }
          }
        } else {
          outputResponse('Please provide a filter to set or NULL to reset.');
        }
        readLine.prompt(); // Display the prompt again
        break;
      case 'SCAN':
        if (!paramSET) {
          outputResponse('No parameter has been set. Please use SETPARAM first.');
          readLine.prompt();
          break;
        }
        if (args[1] && (args[1].toUpperCase() === 'MAX' || args[1].toUpperCase() === 'MIN')) {
          const operation = args[1].toUpperCase();
          if (fileContent) {
            const lines = fileContent.split('\n');
            let resultObjects = [];
            let resultValue = operation === 'MAX' ? -Infinity : Infinity;
            let resultLines = [];
  
            lines.forEach((line, index) => {
              if (line.trim() === '') return;
              try {
                const lineData = JSON.parse(line);
  
                // Apply filter if filterSET is defined and is an object
                if (filterSET && typeof filterSET === 'object' && Object.keys(filterSET).length > 0) {
                  const matchesFilter = Object.entries(filterSET).every(([key, value]) => {
                    return lineData[key] && lineData[key].toString() === value;
                  });
  
                  if (!matchesFilter) return;
                }
  
                let value = lineData[paramSET];
                if (convertHex && typeof value === 'string') {
                  value = parseInt(value, 16); // Convert hex string to decimal
                }
  
                if (typeof value === 'number') {
                  const comparison = operation === 'MAX' ? value > resultValue : value < resultValue;
                  if (comparison) {
                    resultValue = value;
                    resultObjects = [lineData];
                    resultLines = [index + 1];
                  } else if (value === resultValue) {
                    resultObjects.push(lineData);
                    resultLines.push(index + 1);
                  }
                }
              } catch (e) {
                outputResponse(`ERROR PARSING LINE: ${line} - ${e.message}`);
              }
            });
  
            if (resultObjects.length > 0) {
              outputResponse(`${operation === 'MAX' ? 'Maximum' : 'Minimum'} value for '${paramSET}' is ${resultValue}:`);
              resultObjects.slice(0, 3).forEach((obj, idx) => {
                outputResponse(`Found on line ${resultLines[idx]}:`);
                outputResponse(JSON.stringify(obj, null, 2));
              });
              if (resultObjects.length > 3) {
                outputResponse(`...and ${resultObjects.length - 3} more with the same value.`);
              }
            } else {
              outputResponse(`No valid entries found for parameter '${paramSET}'.`);
            }
          } else {
            outputResponse('No file content stored.');
          }
        } else if (args[1] === '>') {
          if (args[2] && !isNaN(args[2])) {
            const threshold = parseFloat(args[2]);
            if (fileContent) {
              const lines = fileContent.split('\n');
              let resultObjects = [];
              let resultLines = [];
  
              lines.forEach((line, index) => {
                if (line.trim() === '') return;
                try {
                  const lineData = JSON.parse(line);
  
                  // Apply filter if filterSET is defined and is an object
                  if (filterSET && typeof filterSET === 'object' && Object.keys(filterSET).length > 0) {
                    const matchesFilter = Object.entries(filterSET).every(([key, value]) => {
                      return lineData[key] && lineData[key].toString() === value;
                    });
  
                    if (!matchesFilter) return;
                  }
  
                  let value = lineData[paramSET];
                  if (convertHex && typeof value === 'string') {
                    value = parseInt(value, 16);
                  }
  
                  if (typeof value === 'number' && value > threshold) {
                    resultObjects.push(lineData);
                    resultLines.push(index + 1);
                  }
                } catch (e) {
                  outputResponse(`ERROR PARSING LINE: ${line} - ${e.message}`);
                }
              });
  
              if (resultObjects.length > 0) {
                outputResponse(`Objects with '${paramSET}' greater than ${threshold}:`);
                resultObjects.slice(0, 3).forEach((obj, idx) => {
                  outputResponse(`Found on line ${resultLines[idx]}:`);
                  outputResponse(JSON.stringify(obj, null, 2));
                });
                if (resultObjects.length > 3) {
                  outputResponse(`...and ${resultObjects.length - 3} more with the same value.`);
                }
              } else {
                outputResponse(`No valid entries found for parameter '${paramSET}' greater than ${threshold}.`);
              }
            } else {
              outputResponse('No file content stored.');
            }
          } else {
            outputResponse('Please provide a valid number to compare.');
          }
        } else {
          outputResponse('Invalid operation. Use SCAN MAX, SCAN MIN, or SCAN > <number>.');
        }
        readLine.prompt();
        break;
      case 'BREAK':
        if (fileContent) {
          const lines = fileContent.split('\n');
          if (!dateSET) {
            outputResponse('No date has been set. Please use SETDATE first.');
            readLine.prompt();
            break;
          }
          // Clear previous results to avoid appending old data
          beforeDate.length = 0;
          afterDate.length = 0;          
          // Iterate over each line and split based on dateSET
          lines.forEach((line) => {
            try {
              const lineData = JSON.parse(line);
              const lineDate = new Date(lineData.TIMESTAMP); // Adjust this based on your date field
              if (lineDate < dateSET) {
                beforeDate.push(line);
              } else {
                afterDate.push(line);
              }
            } catch (e) {
              // Handle parsing errors
              outputResponse(`ERROR PARSING LINE: ${line} - ${e.message}`);
            }
          });
          // Provide output for how many lines were split
          outputResponse(`Total lines before ${dateSET}: ${beforeDate.length}`);
          outputResponse(`Total lines after or on ${dateSET}: ${afterDate.length}`);
          // Optionally: return these arrays for further processing or export
          // For example, you can create a function to save these arrays to files
        } else {
          outputResponse('No file content stored.');
        }
        readLine.prompt(); // Display the prompt again
        break;
      case 'INFO':
        if (fileContent) {
          const firstLine = fileContent.split('\n')[0];
          let firstLineObject;
          try {
            firstLineObject = JSON.parse(firstLine);
            outputResponse(`FIRST LINE AS OBJECT: \n${JSON.stringify(firstLineObject, null, 2)}`);
          } catch (e) {
            outputResponse(`ERROR PARSING FIRST LINE: ${e.message}`);
          }
        } else {
          outputResponse('No file content stored.');
        }
        readLine.prompt(); // Display the prompt again
        break;
      case 'LIST':
        if (fileContent) {
          const lines = fileContent.split('\n');
          outputResponse(`${filepath} HAS TOTAL LINES ${lines.length}`);
          // Apply filtering if filterSET is defined and is an object
          let filteredLines = [];
          let filterDetails = '';
          if (filterSET && typeof filterSET === 'object' && Object.keys(filterSET).length > 0) { // Check if filterSET is an object and has keys
            // Filter lines while preserving their original index
            filteredLines = lines.map((line, index) => ({ line, index })).filter(({ line }) => {
              try {
                const lineData = JSON.parse(line);
                // Check if the line has the filter key and if its value matches the filter value
                return Object.entries(filterSET).every(([key, value]) => {
                  return lineData[key] && lineData[key].toString() === value; // Match the value as string
                });
              } catch (e) {
                outputResponse(`ERROR PARSING LINE: ${line} - ${e.message}`);
                return false; // Exclude lines that cannot be parsed
              }
            });
            // Extract only the filtered lines for displaying
            filteredLines = filteredLines.map(({ line }) => line);
            // Create filter details string
            filterDetails = ` (FILTER: ${JSON.stringify(filterSET)})`;
          } else {
            filteredLines = lines; // If no filters, show all lines
          }
          // Display total filtered lines along with filter details
          outputResponse(`Total lines after applying${filterDetails} = ${filteredLines.length}`);
          // Check for line range input (N1 and optionally N2)
          if (args[1]) {
            const N1 = parseInt(args[1], 10);
            const N2 = args[2] ? parseInt(args[2], 10) : N1; // If N2 is not provided, use N1
            if (!isNaN(N1) && !isNaN(N2) && N1 <= N2 && N1 > 0 && N2 <= filteredLines.length) {
              const selectedLines = filteredLines.slice(N1 - 1, N2).map((line, index) => {
                const originalIndex = lines.indexOf(line); // Get the original line index
                return `${originalIndex + 1}: ${line}`; // +1 to convert 0-based index to 1-based
              }).join('\n');
      
              outputResponse(`STORE FILE CONTENT (LINES ${N1} to ${N2}) :\n${selectedLines}`);
            } else {
              outputResponse(`INVALID LINE RANGE : ${N1} to ${N2}`);
            }
          } else {
            // If no line range provided, just display the total count without listing all lines
            outputResponse(`You can specify a line range (e.g., LIST N1 N2) to view specific lines.`);
          }
        } else {
          outputResponse('No file content stored.');
        }
        readLine.prompt(); // Display the prompt again
        break;
      case 'DATE':
        if (dateSET) { 
          outputResponse(dateSET);
        } else {
          outputResponse('DATE WAS NOT SET');
        }
        readLine.prompt(); // Display the prompt again
        break;
      case 'HELP':
        outputResponse('AVAILABLE COMMANDS:');
        COMMANDS.forEach(cmd => {
          outputResponse(`  - ${cmd.command}: ${cmd.description}`);
        });
        readLine.prompt();
        break;
      default:
        console.log(`Unknown command: ${args[0]}`);
        readLine.prompt(); // Display the prompt again
        break;
    }
  })
  .on('close', () => {
    outputResponse('Have a great day!');
    process.exit(0);
  });

