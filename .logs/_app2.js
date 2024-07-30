#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Store the file content in a variable
let fileContent = '';

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'FILE-APP> '
});

rl.prompt();

rl.on('line', (line) => {
  const input = line.trim().split(' ');

  if (input[0] === 'FILE' && input[1]) {
    const filepath = input[1];
    const absolutePath = path.resolve(filepath);
    fs.readFile(absolutePath, 'utf8', (err, data) => {
      if (err) {
        console.error(`Error reading file from disk: ${err}`);
      } else {
        fileContent = data;
        console.log(`File content stored:\n${fileContent.length}`);
      }
      rl.prompt(); // Display the prompt again
    });
  } else if (input[0] == 'SETDATE' && input[1]) {
    let ObjDate = new Date(input[1])
    console.log(input[1]);
  } else if (input[0] === 'PRINT') {
    if (fileContent) {
      console.log(`Stored file content:\n${fileContent}`);
    } else {
      console.log('No file content stored.');
    }
    rl.prompt(); // Display the prompt again
  } else {
    console.log(`Unknown command: ${input[0]}`);
    rl.prompt(); // Display the prompt again
  }
}).on('close', () => {
  console.log('Have a great day!');
  process.exit(0);
});
