/*
 * Log Archiving & Splitting Application
 * Usage:
 *   node archiveLogsByDate.js <DD-MM> [optional_log_filename]
 *   node archiveLogsByDate.js <DD-MM-YYYY> [optional_log_filename]
 *
 * Examples:
 *   node archiveLogsByDate.js 01-03          # Splits all *.log files: lines earlier than 1st March -> *.log.archive, remaining -> *.log
 *   node archiveLogsByDate.js 01-03-2026     # Explicit year 2026
 *   node archiveLogsByDate.js 01-03 _EPSON   # Run specifically on _EPSON.log
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const LOGS_DIR = path.join(__dirname, '.logs');

// ─── Utility Functions ──────────────────────────────────────────────────────

function parseCutoffInput(inputStr) {
  if (!inputStr) return null;
  const parts = inputStr.trim().split(/[-/]/);
  if (parts.length < 2) return null;

  const day = Number(parts[0]);
  const month = Number(parts[1]);
  let year = parts[2] ? Number(parts[2]) : new Date().getFullYear();

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (year < 100) year += 2000;

  // Cutoff date is set to 00:00:00.000 on specified day
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function extractLineDate(line) {
  if (!line || !line.trim()) return null;
  const trimmed = line.trim();

  // 1. JSON parse attempt
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const obj = JSON.parse(trimmed);
      const ts = obj.TIMESTAMP || obj.timestamp || obj.datetime || obj.DATE0 || obj.TIMESTAMP_ISO || obj.date;
      if (ts) {
        const d = new Date(ts);
        if (!isNaN(d.getTime())) return d;
      }
    } catch (e) { /* fallback */ }
  }

  // 2. ISO Date: YYYY-MM-DD
  const isoMatch = trimmed.match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const d = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    if (!isNaN(d.getTime())) return d;
  }

  // 3. Standard Date: DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const d = new Date(Number(dmyMatch[3]), Number(dmyMatch[2]) - 1, Number(dmyMatch[1]));
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ─── File Processing Function ───────────────────────────────────────────────

async function processLogFile(filePath, cutoffDate) {
  const fileName = path.basename(filePath);
  const baseName = fileName.replace(/\.log$/, '');
  const archivePath = path.join(LOGS_DIR, `${baseName}.log.archive`);
  const tempPath = path.join(LOGS_DIR, `${baseName}.log.tmp`);

  const stats = fs.statSync(filePath);
  const initialSizeBytes = stats.size;

  let totalLines = 0;
  let archivedLines = 0;
  let retainedLines = 0;
  let unparsedLines = 0;

  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const archiveStream = fs.createWriteStream(archivePath, { flags: 'a', encoding: 'utf8' });
  const tempStream = fs.createWriteStream(tempPath, { flags: 'w', encoding: 'utf8' });

  for await (const line of rl) {
    totalLines++;
    const lineDate = extractLineDate(line);

    if (lineDate && lineDate < cutoffDate) {
      archiveStream.write(line + '\n');
      archivedLines++;
    } else {
      if (!lineDate) unparsedLines++;
      tempStream.write(line + '\n');
      retainedLines++;
    }
  }

  await new Promise((resolve) => archiveStream.end(resolve));
  await new Promise((resolve) => tempStream.end(resolve));

  // Atomic swap: Replace original .log with .log.tmp
  fs.renameSync(tempPath, filePath);

  const newLogStats = fs.statSync(filePath);
  const archiveStats = fs.existsSync(archivePath) ? fs.statSync(archivePath) : { size: 0 };

  return {
    fileName,
    initialSize: formatBytes(initialSizeBytes),
    newLogSize: formatBytes(newLogStats.size),
    archiveSize: formatBytes(archiveStats.size),
    totalLines,
    archivedLines,
    retainedLines,
    unparsedLines,
  };
}

// ─── Main Execution ─────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dateArg = args[0];
  const targetFileArg = args[1];

  console.log('================================================================');
  console.log('            LOG ARCHIVING & SPLITTING UTILITY                   ');
  console.log('================================================================\n');

  if (!dateArg) {
    console.log('Usage:');
    console.log('  node archiveLogsByDate.js <DD-MM> [optional_log_filename]');
    console.log('  node archiveLogsByDate.js <DD-MM-YYYY> [optional_log_filename]\n');
    console.log('Examples:');
    console.log('  node archiveLogsByDate.js 01-03          # Move lines earlier than 1st March to *.log.archive');
    console.log('  node archiveLogsByDate.js 01-03 _EPSON   # Run only on _EPSON.log');
    process.exit(1);
  }

  const cutoffDate = parseCutoffInput(dateArg);
  if (!cutoffDate) {
    console.error(`ERROR: Invalid date format "${dateArg}". Expected DD-MM or DD-MM-YYYY.`);
    process.exit(1);
  }

  console.log(`Cutoff Threshold Date : ${cutoffDate.toDateString()} (00:00:00.000)`);
  console.log(`Action Rule           : Lines EARLIER than ${cutoffDate.toDateString()} -> *.log.archive`);
  console.log(`                      : Lines ON/AFTER ${cutoffDate.toDateString()}    -> *.log\n`);

  if (!fs.existsSync(LOGS_DIR)) {
    console.error(`ERROR: Logs directory "${LOGS_DIR}" does not exist.`);
    process.exit(1);
  }

  let filesToProcess = [];
  if (targetFileArg) {
    const cleanName = targetFileArg.replace(/\.log$/, '') + '.log';
    const fullPath = path.join(LOGS_DIR, cleanName);
    if (!fs.existsSync(fullPath)) {
      console.error(`ERROR: Target log file "${fullPath}" not found.`);
      process.exit(1);
    }
    filesToProcess.push(fullPath);
  } else {
    const allFiles = fs.readdirSync(LOGS_DIR);
    filesToProcess = allFiles
      .filter((f) => f.endsWith('.log') && !f.endsWith('.archive'))
      .map((f) => path.join(LOGS_DIR, f));
  }

  if (filesToProcess.length === 0) {
    console.log('No .log files found to process.');
    process.exit(0);
  }

  console.log(`Found ${filesToProcess.length} log file(s) to process:\n`);

  for (const filePath of filesToProcess) {
    console.log(`Processing: ${path.basename(filePath)} ...`);
    const res = await processLogFile(filePath, cutoffDate);

    console.log(`  └─ Total Lines    : ${res.totalLines}`);
    console.log(`  └─ Moved to Archive: ${res.archivedLines} (${res.archiveSize})`);
    console.log(`  └─ Retained in Log: ${res.retainedLines} (${res.newLogSize})`);
    if (res.unparsedLines > 0) {
      console.log(`  └─ Note           : ${res.unparsedLines} lines without parseable date retained in .log`);
    }
    console.log('');
  }

  console.log('================================================================');
  console.log('             LOG SPLITTING COMPLETED SUCCESSFULLY               ');
  console.log('================================================================');
}

main().catch((err) => {
  console.error('Fatal error during log archiving:', err);
  process.exit(1);
});
