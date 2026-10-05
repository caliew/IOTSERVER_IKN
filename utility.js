/**
 * utility.js — Log Cleaning Utility
 *
 * Scans .log files in .logs/ (or a specified file/directory) and removes redundant lines:
 *   1. Lines with empty or missing `RCV.BYTES` (e.g., `{"RCV.BYTES":""}`).
 *   2. Blank / empty lines.
 *   3. Optional: duplicate consecutive lines (with --dedupe flag).
 *
 * Usage:
 *   node utility.js                       Clean all .log files in .logs/
 *   node utility.js --file .logs/_IKN_PATHOLOGY.log   Clean a specific file
 *   node utility.js --dry-run             Preview cleaning results without writing to disk
 *   node utility.js --dedupe              Also remove duplicate consecutive lines
 *   node utility.js --no-backup           Overwrite files directly without creating .bak backups
 */

const fs   = require('fs');
const path = require('path');

const ARGS = process.argv.slice(2);

// Options
const isDryRun   = ARGS.includes('--dry-run');
const removeDupes = ARGS.includes('--dedupe');
const noBackup   = ARGS.includes('--no-backup');

let targetFile = null;
let targetDir  = path.join(__dirname, '.logs');

for (let i = 0; i < ARGS.length; i++) {
  if (ARGS[i] === '--file' && ARGS[i + 1]) {
    targetFile = path.resolve(ARGS[i + 1]);
    i++;
  } else if (ARGS[i] === '--dir' && ARGS[i + 1]) {
    targetDir = path.resolve(ARGS[i + 1]);
    i++;
  }
}

/**
 * Checks if a line is redundant (e.g. empty RCV.BYTES or blank line)
 */
function isRedundantLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return true; // Empty line

  try {
    const parsed = JSON.parse(trimmed);

    // Check if RCV.BYTES field exists and is empty ("" or null or undefined or empty array)
    if (Object.prototype.hasOwnProperty.call(parsed, 'RCV.BYTES')) {
      const bytes = parsed['RCV.BYTES'];
      if (bytes === '' || bytes === null || bytes === undefined) {
        return true;
      }
      if (Array.isArray(bytes) && bytes.length === 0) {
        return true;
      }
    }
  } catch (_) {
    // Non-JSON or malformed line — retain it to prevent data loss unless completely blank
  }

  return false;
}

/**
 * Processes a single log file
 */
function processLogFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`[UTILITY] ❌ File not found: ${filePath}`);
    return;
  }

  const rawContent = fs.readFileSync(filePath, 'utf8');
  const lines = rawContent.split(/\r?\n/);

  const cleanedLines = [];
  let removedEmptyBytesCount = 0;
  let removedBlankCount = 0;
  let removedDupeCount = 0;

  let lastLine = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      removedBlankCount++;
      continue;
    }

    if (isRedundantLine(trimmed)) {
      removedEmptyBytesCount++;
      continue;
    }

    if (removeDupes && lastLine === trimmed) {
      removedDupeCount++;
      continue;
    }

    cleanedLines.push(trimmed);
    lastLine = trimmed;
  }

  const totalRemoved = lines.length - cleanedLines.length;

  console.log(`\n📄 File: ${path.basename(filePath)}`);
  console.log(`   - Total lines before: ${lines.length}`);
  console.log(`   - Cleaned lines:      ${cleanedLines.length}`);
  console.log(`   - Removed lines:      ${totalRemoved}`);
  if (removedEmptyBytesCount > 0) {
    console.log(`     └─ Empty RCV.BYTES: ${removedEmptyBytesCount}`);
  }
  if (removedBlankCount > 0) {
    console.log(`     └─ Blank lines:     ${removedBlankCount}`);
  }
  if (removedDupeCount > 0) {
    console.log(`     └─ Duplicates:      ${removedDupeCount}`);
  }

  if (totalRemoved === 0) {
    console.log(`   ✔ No redundant lines found.`);
    return;
  }

  if (isDryRun) {
    console.log(`   🔍 [DRY RUN] No changes written to disk.`);
    return;
  }

  // Backup original file unless --no-backup is specified
  if (!noBackup) {
    const backupPath = `${filePath}.bak`;
    fs.writeFileSync(backupPath, rawContent, 'utf8');
    console.log(`   💾 Backup created: ${path.basename(backupPath)}`);
  }

  // Write cleaned content back to file
  fs.writeFileSync(filePath, cleanedLines.join('\n') + '\n', 'utf8');
  console.log(`   ✅ File successfully cleaned.`);
}

// Execution entry point
console.log(`====================================================`);
console.log(` 🧹 LOG CLEANING UTILITY (${isDryRun ? 'DRY RUN MODE' : 'WRITE MODE'})`);
console.log(`====================================================`);

if (targetFile) {
  processLogFile(targetFile);
} else if (fs.existsSync(targetDir)) {
  const files = fs.readdirSync(targetDir);
  const logFiles = files.filter(f => f.endsWith('.log'));

  if (logFiles.length === 0) {
    console.log(`No .log files found in ${targetDir}`);
  } else {
    logFiles.forEach(file => {
      processLogFile(path.join(targetDir, file));
    });
  }
} else {
  console.error(`[UTILITY] ❌ Target directory does not exist: ${targetDir}`);
}

console.log(`\n====================================================`);
console.log(` Complete!`);
console.log(`====================================================\n`);
