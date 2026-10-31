#!/usr/bin/env node
/**
 * .logs/utility.js - Log Utility CLI
 *
 * Interactive mode (recommended): run `node .logs/utility.js` once, then type
 * commands at the prompt. Type `exit` to leave.
 *
 * One-shot mode: pass arguments and it runs once, then exits.
 *
 * Commands are selected with a flag:
 *   node .logs/utility.js --clean  [options]
 *   node .logs/utility.js --trace  [options]
 *   node .logs/utility.js --command:clean   (same as --clean)
 *   node .logs/utility.js --help            (list all commands)
 *   node .logs/utility.js --trace --help    (options for one command)
 *
 * HOW TO ADD A NEW COMMAND
 *   1. Create a command object (copy `restoreCommand` as the smallest template).
 *   2. Add it to the COMMANDS array near the bottom of this file.
 *   Help text, `--<name>` / `--command:<name>` selection and option parsing
 *   are all generated from the command object.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const TOOL  = 'utility.js';
const VERSION = '2.0.0';

// ---- Settings (change these) -------------------------------------
const PAGE_SIZE = 24;   // max files shown per page in the file list (status / n / p / page)
const TIME_MODE = 'local';  // how trace shows and accepts times: 'local' (this computer's time zone) or 'utc' (as stored). In the program: time local | time utc
const USE_COLOR = true; // colored output (auto-off when not a terminal, or if NO_COLOR is set). In the program: color on | color off
const TIME_KEY = 'TIMESTAMP';        // key holding the record time (used by trace --from / --to)
const KEYS_LIST_VALUES_MAX = 30;     // keys: list value counts when a key has at most this many distinct values
const KEYS_TOP_VALUES = 6;           // keys: how many of those values to show
const KEYS_MAX_DISTINCT = 5000;      // keys: stop counting distinct values after this many
// ------------------------------------------------------------------

// -------------------------------------------------------------
// Color helpers (ANSI escape codes, no dependencies)
// -------------------------------------------------------------

let timeMode = TIME_MODE;
let colorEnabled = USE_COLOR && !process.env.NO_COLOR &&
  (Boolean(process.stdout.isTTY) || Boolean(process.env.FORCE_COLOR));

const paint = (code, text) => (colorEnabled ? `\x1b[${code}m${text}\x1b[0m` : String(text));
const clr = {
  bold:   (t) => paint('1', t),
  title:  (t) => paint('1;36', t),   // bold cyan: headings
  red:    (t) => paint('31', t),
  green:  (t) => paint('32', t),
  yellow: (t) => paint('33', t),
  cyan:   (t) => paint('36', t),
  gray:   (t) => paint('90', t),
};

class CliError extends Error {}

// -------------------------------------------------------------
// Option parsing
// -------------------------------------------------------------

const toCamel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/**
 * Option shape:
 *   { name, alias?, type: 'boolean'|'string'|'number', valueName?, description, default? }
 * Supports: --flag, --opt value, --opt=value, -a, -o value, and `--` to stop parsing.
 */
function parseArgs(argv, optionDefs, allCommands = []) {
  const opts = {};
  const given = {}; // only the options typed on this line
  const positional = [];
  const lookup = new Map();

  for (const def of optionDefs) {
    lookup.set(`--${def.name}`, def);
    if (def.alias) lookup.set(`-${def.alias}`, def);
    for (const a of def.aliases || []) lookup.set(`--${a}`, def);
    opts[toCamel(def.name)] =
      def.default !== undefined ? def.default : def.type === 'boolean' ? false : undefined;
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--') {
      positional.push(...argv.slice(i + 1));
      break;
    }
    if (!(arg.length > 1 && arg.startsWith('-'))) {
      positional.push(arg);
      continue;
    }

    let flag = arg;
    let inline;
    const eq = arg.indexOf('=');
    if (arg.startsWith('--') && eq !== -1) {
      flag = arg.slice(0, eq);
      inline = arg.slice(eq + 1);
    }

    const def = lookup.get(flag);
    if (!def) {
      const owner = allCommands.find((c) => (c.options || []).some((o) => `--${o.name}` === flag || `-${o.alias}` === flag));
      throw new CliError(
        owner
          ? `Option ${flag} belongs to --${owner.name}. Use it together with --${owner.name}.`
          : `Unknown option: ${flag}`
      );
    }

    const key = toCamel(def.name);
    if (def.type === 'boolean') {
      opts[key] = inline === undefined ? true : inline !== 'false';
      given[key] = opts[key];
      continue;
    }

    const value = inline !== undefined ? inline : argv[++i];
    if (value === undefined || (inline === undefined && value.startsWith('--'))) {
      throw new CliError(`Option ${flag} requires a value`);
    }
    if (def.type === 'number') {
      const n = Number(value);
      if (!Number.isFinite(n)) throw new CliError(`Option ${flag} expects a number, got "${value}"`);
      opts[key] = n;
    } else if (def.multiple) {
      opts[key] = [...(opts[key] || []), value];
    } else {
      opts[key] = value;
    }
    given[key] = opts[key];
  }

  return { opts, positional, given };
}

/**
 * Pulls the selected command out of argv.
 * Accepts `--<name>`, `--command:<name>` and `--command=<name>`.
 */
function extractCommand(argv, commands) {
  const selected = [];
  const rest = [];

  for (const arg of argv) {
    const m = /^--command[:=](.+)$/.exec(arg);
    const name = m ? m[1] : arg.startsWith('--') ? arg.slice(2) : null;
    const cmd = name ? commands.find((c) => c.name === name) : null;

    if (cmd) selected.push(cmd);
    else if (m) throw new CliError(`Unknown command: ${m[1]}`);
    else rest.push(arg);
  }

  const unique = [...new Set(selected)];
  if (unique.length > 1) {
    throw new CliError(`Only one command can run at a time (got ${unique.map((c) => '--' + c.name).join(', ')}).`);
  }
  return { command: unique[0] || null, rest };
}

// -------------------------------------------------------------
// Global options & help rendering
// -------------------------------------------------------------

const GLOBAL_OPTIONS = [
  { name: 'file',    alias: 'f', type: 'string',  valueName: 'path', description: 'Target a specific log file' },
  { name: 'dir',     alias: 'd', type: 'string',  valueName: 'path', description: 'Run on all .log files in a folder' },
  { name: 'help',    alias: 'h', type: 'boolean', description: 'Show help' },
  { name: 'version', alias: 'v', type: 'boolean', description: 'Show version' },
];

function optionRow(def) {
  const short = def.alias ? `-${def.alias}, ` : '    ';
  const value = def.type === 'boolean' ? '' : ` <${def.valueName || def.type}>`;
  return [`${short}--${def.name}${value}`, def.description + (def.default !== undefined && def.type !== 'boolean' ? ` (default: ${def.default})` : '')];
}

function table(rows, indent = '  ') {
  const w = Math.max(...rows.map((r) => r[0].length)) + 3;
  return rows.map(([l, r]) => `${indent}${clr.cyan(l.padEnd(w))}${r}`).join('\n');
}

/** Colors section headings ("Usage:", "Options:", ...) in help text. */
function paintHeadings(text) {
  return text
    .replace(/^(Log Utility v.*)$/gm, (m) => clr.title(m))
    .replace(/^([A-Z][^\n]*:)$/gm, (m) => clr.title(m));
}

function showGlobalHelp(commands) {
  console.log(paintHeadings(`
Log Utility v${VERSION}

Usage:
  node .logs/${TOOL} --<command> [options]

Commands:
${table(commands.map((c) => [`--${c.name}`, c.description]))}

Common options:
${table(GLOBAL_OPTIONS.map(optionRow))}

Tips:
  --<command> --help        Show the options for one command
  --command:<name>          Alternative way to pick a command (e.g. --command:clean)

Interactive mode (run with no arguments):
  status [text]             Show the selected file and a numbered list of files (text = name filter)
  n / p / page <n>          Next / previous / jump page when the list is long (Space+Enter = next)
  reset [command]           Forget remembered parameters (e.g. reset trace)
  time local | utc          Show trace times in your local time zone (default) or as stored (UTC)
  color on | off            Turn colored output on or off
  use <number|path>         Select a log file so you can skip --file (use off to clear)
  clear                     Clear the screen
  exit                      Leave the program
  Commands work with or without dashes: trace --dtu 320  ==  --trace --dtu 320
`));
}

function showCommandHelp(cmd) {
  const out = [`\n${clr.bold(`--${cmd.name}`)} - ${cmd.description}\n`];
  if ((cmd.details || []).length) out.push(`About:\n${cmd.details.map((l) => `  ${l}`).join('\n')}\n`);
  const args = cmd.usage || '[options]';
  out.push(`Usage:\n  ${cmd.name} ${args}`.replace(/ +$/, '') + `        (inside the program)\n  node .logs/${TOOL} --${cmd.name} ${args}        (one-shot)\n`);
  if ((cmd.options || []).length) out.push(`Options:\n${table(cmd.options.map(optionRow))}\n`);
  out.push(`Common options:\n${table(GLOBAL_OPTIONS.filter((o) => ['file', 'dir'].includes(o.name)).map(optionRow))}\n`);
  if ((cmd.examples || []).length) {
    out.push(`Examples:\n${cmd.examples.map((e) => `  ${e.replace(`--${cmd.name}`, cmd.name)}`).join('\n')}\n`);
  }
  console.log(paintHeadings(out.join('\n')));
}

// -------------------------------------------------------------
// Shared helpers
// -------------------------------------------------------------

/**
 * Resolves target files: --file > positional paths > --dir (all .log files in it).
 * With none of these it stops: nothing runs on files you did not choose.
 */
function resolveLogFiles({ opts, positional, session }) {
  if (opts.file) return [path.resolve(opts.file)];
  if (positional.length) return positional.map((p) => path.resolve(p));

  if (opts.dir) {
    const { dir, files } = listLogFiles(opts.dir);
    console.log(`Target: ALL ${files.length} .log file(s) in ${dir}`);
    return files;
  }

  throw new CliError(session && session.interactive
    ? 'No file selected yet. Type status to list the files, then use <number> to select one.'
    : 'No file selected. Add --file <path> (or --dir <folder> for all .log files in a folder).');
}

/** Lists .log files in a directory (default: the script folder). */
function listLogFiles(dirOpt) {
  const dir = dirOpt ? path.resolve(dirOpt) : __dirname;
  if (!fs.existsSync(dir)) throw new CliError(`Target directory does not exist: ${dir}`);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.log')).sort().map((f) => path.join(dir, f));
  return { dir, files };
}

function fmtSize(bytes) {
  return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
}

/** Splits text into lines, ignoring the empty string after a trailing newline. */
function splitLines(raw) {
  const lines = raw.split(/\r?\n/);
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

/** Reads a file or reports it as missing (sets exit code 1). Returns null if missing. */
function readLogOrWarn(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(clr.red(`\n❌ File not found: ${filePath}`));
    process.exitCode = 1;
    return null;
  }
  return fs.readFileSync(filePath, 'utf8');
}

// -------------------------------------------------------------
// --clean  (core logic is pure so it can be reused / tested)
// -------------------------------------------------------------

function hasEmptyRcvBytes(trimmedLine) {
  try {
    const parsed = JSON.parse(trimmedLine);
    if (parsed && Object.prototype.hasOwnProperty.call(parsed, 'RCV.BYTES')) {
      const b = parsed['RCV.BYTES'];
      if (b === '' || b === null || b === undefined) return true;
      if (Array.isArray(b) && b.length === 0) return true;
    }
  } catch (_) {
    // Non-JSON / malformed - keep it to avoid data loss
  }
  return false;
}

function cleanContent(raw, { dedupe = false } = {}) {
  const lines = splitLines(raw);
  const cleaned = [];
  const stats = { before: lines.length, blank: 0, emptyBytes: 0, dupes: 0 };
  let last = null;

  for (const line of lines) {
    const t = line.trim();
    if (!t)                          { stats.blank++;      continue; }
    if (hasEmptyRcvBytes(t))         { stats.emptyBytes++; continue; }
    if (dedupe && last === t)        { stats.dupes++;      continue; }
    cleaned.push(t);
    last = t;
  }

  stats.after = cleaned.length;
  stats.removed = stats.before - cleaned.length;
  return { cleaned, stats };
}

const cleanCommand = {
  name: 'clean',
  modifies: true,
  description: 'Remove blank lines and empty RCV.BYTES lines from log files',
  details: [
    'Tidies a log file in place so other commands (such as trace) work on clean data.',
    'It removes:',
    '  1. Blank lines',
    '  2. Lines whose RCV.BYTES is empty ("", null or [])',
    '  3. Duplicate consecutive lines (only when --dedupe is given)',
    'Lines that are not valid JSON are always kept, so nothing is lost by accident.',
    'Kept lines are trimmed of leading/trailing spaces.',
    'A backup (<file>.bak) is written first unless --no-backup is used. Each run',
    'overwrites the previous backup. Undo with: restore',
    'Tip: run with --dry-run first to preview the result.',
  ],
  usage: '[options]',
  options: [
    { name: 'dry-run',   alias: 'n', type: 'boolean', description: 'Preview results without writing to disk' },
    { name: 'dedupe',               type: 'boolean', description: 'Also remove duplicate consecutive lines' },
    { name: 'no-backup',            type: 'boolean', description: 'Overwrite files without creating .bak backups' },
  ],
  examples: [
    '--clean',
    '--clean --dry-run',
    '--clean --file .logs/_IKN_PATHOLOGY.log --dedupe',
    '--command:clean --no-backup',
  ],

  run(ctx) {
    const { opts } = ctx;
    const files = resolveLogFiles(ctx);
    console.log(clr.bold('🧹 --clean ') + (opts.dryRun ? clr.green('(DRY RUN)') : clr.yellow('(WRITE MODE)')));
    if (!files.length) return console.log('No .log files found.');

    for (const filePath of files) {
      const raw = readLogOrWarn(filePath);
      if (raw === null) continue;

      const { cleaned, stats } = cleanContent(raw, { dedupe: opts.dedupe });

      console.log(clr.bold(`\n📄 ${path.basename(filePath)}`));
      console.log(`   - Lines before: ${stats.before}`);
      console.log(`   - Lines after:  ${stats.after}`);
      console.log(`   - Removed:      ${stats.removed ? clr.yellow(stats.removed) : stats.removed}`);
      if (stats.emptyBytes) console.log(`     └─ Empty RCV.BYTES: ${stats.emptyBytes}`);
      if (stats.blank)      console.log(`     └─ Blank lines:     ${stats.blank}`);
      if (stats.dupes)      console.log(`     └─ Duplicates:      ${stats.dupes}`);

      if (stats.removed === 0) { console.log(clr.green('   ✔ No redundant lines found.')); continue; }
      if (opts.dryRun)         { console.log(clr.yellow('   🔍 [DRY RUN] No changes written.')); continue; }

      if (!opts.noBackup) {
        fs.writeFileSync(`${filePath}.bak`, raw, 'utf8');
        console.log(clr.cyan(`   💾 Backup: ${path.basename(filePath)}.bak`));
      }
      fs.writeFileSync(filePath, cleaned.join('\n') + '\n', 'utf8');
      console.log(clr.green('   ✅ Cleaned.'));
    }
  },
};

// -------------------------------------------------------------
// JSONL helpers (one JSON object per line)
// -------------------------------------------------------------

/** Parses JSONL text. Returns the records plus line counts. */
function readJsonl(raw) {
  const records = [];
  let total = 0, blank = 0, malformed = 0;

  for (const line of splitLines(raw)) {
    total++;
    const t = line.trim();
    if (!t) { blank++; continue; }

    let o;
    try { o = JSON.parse(t); } catch (_) { malformed++; continue; }
    if (o === null || typeof o !== 'object' || Array.isArray(o)) { malformed++; continue; }

    records.push({ o, raw: t });
  }
  return { records, total, blank, malformed };
}

const clip = (text, n) => (text.length > n ? `${text.slice(0, n - 3)}...` : text);
const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);

// -------------------------------------------------------------
// --keys  (which keys exist in the file, and what they contain)
// -------------------------------------------------------------

function analyzeKeys(records) {
  const info = new Map();

  for (const { o } of records) {
    for (const k of Object.keys(o)) {
      let e = info.get(k);
      if (!e) {
        e = { count: 0, types: new Set(), values: new Map(), overflow: false, min: undefined, max: undefined, sample: undefined };
        info.set(k, e);
      }
      const v = o[k];
      const t = typeOf(v);
      e.count++;
      e.types.add(t);
      if (t === 'object' || t === 'array') continue;

      const text = String(v);
      if (e.sample === undefined) e.sample = text;
      if (!e.overflow) {
        e.values.set(text, (e.values.get(text) || 0) + 1);
        if (e.values.size > KEYS_MAX_DISTINCT) e.overflow = true;
      }
      if (t === 'number' || t === 'string') {
        if (e.min === undefined || v < e.min) e.min = v;
        if (e.max === undefined || v > e.max) e.max = v;
      }
    }
  }
  return info;
}

function describeValues(e) {
  if (!e.values.size) return '-';
  if (!e.overflow && e.values.size <= KEYS_LIST_VALUES_MAX) {
    const top = [...e.values.entries()].sort((a, b) => b[1] - a[1]).slice(0, KEYS_TOP_VALUES);
    const text = top.map(([v, c]) => `${clip(v, 24)} (${c})`).join(', ');
    return e.values.size > top.length ? `${text}, ...` : text;
  }
  const isIsoTime = typeof e.min === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(e.min);
  if (e.types.has('number') || isIsoTime) return `range ${clip(String(e.min), 24)} .. ${clip(String(e.max), 24)}`;
  return `e.g. ${clip(String(e.sample), 40)}`;
}

function printKeys(filePath, parsed) {
  const { records, total, blank, malformed } = parsed;
  const extra = `${malformed ? `, ${malformed} malformed` : ''}${blank ? `, ${blank} blank` : ''}`;
  console.log(`\n\u{1F4C4} ${clr.bold(path.basename(filePath))}  ${clr.gray(`(${total} lines, ${records.length} JSON records${extra})`)}`);
  if (!records.length) return console.log('   No JSON records found.');

  const rows = [...analyzeKeys(records).entries()].map(([key, e]) => {
    const pct = Math.round((e.count / records.length) * 100);
    return {
      key,
      present: pct < 100 ? `${e.count} (${pct}%)` : String(e.count),
      type: [...e.types].join('|'),
      distinct: !e.values.size ? '-' : e.overflow ? `${KEYS_MAX_DISTINCT}+` : String(e.values.size),
      values: describeValues(e),
    };
  });

  const w = (name, get) => Math.max(name.length, ...rows.map((r) => get(r).length)) + 2;
  const kw = w('KEY', (r) => r.key), pw = w('PRESENT', (r) => r.present);
  const tw = w('TYPE', (r) => r.type), dw = w('DISTINCT', (r) => r.distinct);

  console.log(clr.bold(`\n   ${'KEY'.padEnd(kw)}${'PRESENT'.padEnd(pw)}${'TYPE'.padEnd(tw)}${'DISTINCT'.padEnd(dw)}VALUES`));
  for (const r of rows) {
    console.log(`   ${clr.cyan(r.key.padEnd(kw))}${r.present.padEnd(pw)}${clr.gray(r.type.padEnd(tw))}${r.distinct.padEnd(dw)}${r.values}`);
  }
  console.log(clr.gray('\n   Use these key names with:  trace --where KEY=value'));
}

const keysCommand = {
  name: 'keys',
  description: 'Show the keys (fields) found in the selected JSONL log file',
  details: [
    'Each line of the log is one JSON record. This lists every key found, how many',
    'records have it (PRESENT), its type, how many distinct values it has, and the',
    'most common values (or the range). Shown automatically when you select a file.',
    'Use the key names with: trace --where KEY=value',
  ],
  usage: '[options]',
  options: [],
  examples: ['keys', 'keys --file .logs/_IKN_PATHOLOGY.log'],

  run(ctx) {
    const files = resolveLogFiles(ctx);
    if (!files.length) return console.log('No .log files found.');

    for (const filePath of files) {
      const raw = readLogOrWarn(filePath);
      if (raw !== null) printKeys(filePath, readJsonl(raw));
    }
  },
};

// -------------------------------------------------------------
// --trace  (follow records by key values: DTU, sensor, any key)
// -------------------------------------------------------------

function parseIdList(text, label) {
  const ids = text.split(',').map((s) => s.trim()).filter(Boolean).map((s) => {
    const n = Number(s);
    if (!Number.isInteger(n)) throw new CliError(`${label} expects integer ID(s), got "${s}"`);
    return n;
  });
  if (!ids.length) throw new CliError(`${label} needs at least one ID`);
  return ids;
}

const pad = (n, w = 2) => String(n).padStart(w, '0');

/** Time zone label, e.g. "UTC+08:00" (or "UTC" in utc mode). */
function tzLabel() {
  if (timeMode === 'utc') return 'UTC';
  const off = -new Date().getTimezoneOffset();
  const a = Math.abs(off);
  return `UTC${off >= 0 ? '+' : '-'}${pad(Math.floor(a / 60))}:${pad(a % 60)}`;
}

/** Formats a stored ISO timestamp for display: local time by default. */
function formatTime(iso) {
  if (timeMode === 'utc' || !iso) return iso || '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

/**
 * Parses a time filter. Without an explicit zone (Z or +08:00) the value is read in the
 * current time mode: local time by default, or UTC after "time utc".
 */
function parseTime(text, label) {
  let t = text.trim().replace(/^(\d{4}-\d{2}-\d{2}) /, '$1T');
  const hasZone = /(Z|[+-]\d{2}:\d{2})$/i.test(t);
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) t += 'T00:00:00';
  if (!hasZone && timeMode === 'utc' && /^\d{4}-\d{2}-\d{2}T[\d:.]+$/.test(t)) t += 'Z';
  const ms = Date.parse(t);
  if (Number.isNaN(ms)) throw new CliError(`${label} is not a valid date/time: "${text}" (try 2026-10-04 or 2026-10-04T08:30)`);
  return ms;
}

/** "KEY=a,b" or "KEY!=a" -> condition. Values compare as text, ignoring case. */
function makeCondition(key, negate, values) {
  return {
    key,
    negate,
    values: new Set(values.map((v) => String(v).trim().toUpperCase())),
    label: `${key}${negate ? '!=' : '='}${values.join(',')}`,
  };
}

function parseWhere(text) {
  const m = /^\s*([^=!]+?)\s*(!?=)\s*(.*)$/.exec(text);
  if (!m) throw new CliError(`--where expects KEY=value or KEY!=value, got "${text}"`);
  return makeCondition(m[1], m[2] === '!=', m[3].split(','));
}

function matchCondition(o, c) {
  const v = o[c.key];
  const text = v === undefined ? '<MISSING>' : v === null ? 'NULL' : String(v).toUpperCase();
  return c.values.has(text) !== c.negate;
}

function recordLine(o) {
  const modeColor = { 'HEART-BEAT': clr.cyan, 'POWER-ON': clr.green, 'POWER-OFF': clr.red }[o.MODE] || ((t) => t);
  let extra = o.MODE === 'HEART-BEAT' ? `BATT=${o.BATT} ${o.HB_NOTE ?? ''}`.trim() : (o.TYPE || '');
  if (o.MODE === 'HEART-BEAT' && o.HB_NOTE && o.HB_NOTE !== 'NORMAL') extra = clr.yellow(extra);
  return `${clr.gray(formatTime(o[TIME_KEY]).padEnd(24))}  ${modeColor(String(o.MODE).padEnd(10))}  DTU ${String(o['DTU.ID']).padEnd(5)} S${String(o['SENSOR.ID']).padEnd(2)}  ${String(o['RCV.BYTES'] ?? '').padEnd(10)} ${extra}`;
}

const traceCommand = {
  name: 'trace',
  description: 'Trace records by key values (DTU ID, sensor ID or any key) in log files',
  details: [
    'Read-only. Filters the log, then shows:',
    '  - a summary (records by mode and sensor, first/last seen, latest battery per DTU)',
    '  - the latest matching records (use --latest, or --summary to hide them)',
    'Filter on ANY key with --where KEY=value. Use the keys command to see the key names.',
    '  --where KEY=a,b    key equals a or b      --where KEY!=a    key is not a',
    '  Repeat --where for several keys. All filters must match (AND).',
    '--dtu, --sensor and --mode are shortcuts for DTU.ID, SENSOR.ID and MODE.',
    'Times are shown and entered in local time by default (type: time utc to switch).',
    '--export saves the matching raw lines (times stay UTC, as stored).',
    'Parameters are remembered between trace commands. After "trace --dtu 320", the',
    'next "trace --latest 10" still filters DTU 320. Giving an option again replaces it.',
    'Type status to see what is remembered; "trace --reset" or "reset" clears it.',
    '--summary and --export are never remembered.',
  ],
  usage: '[--where KEY=value] [--dtu <ids>] [options]',
  options: [
    { sticky: true, name: 'where',   type: 'string', valueName: 'KEY=value', multiple: true, description: 'Filter on any key: KEY=v1,v2 or KEY!=v (repeatable)' },
    { sticky: true, name: 'dtu',     type: 'string', valueName: 'ids',  description: 'Shortcut for --where DTU.ID=... (comma-separated)' },
    { sticky: true, name: 'sensor',  type: 'string', valueName: 'ids',  description: 'Shortcut for --where SENSOR.ID=... (comma-separated)' },
    { sticky: true, name: 'mode',    type: 'string', valueName: 'list', description: 'Shortcut for --where MODE=... (e.g. RS485, HEART-BEAT)' },
    { sticky: true, name: 'from',    type: 'string', valueName: 'time', description: 'Start time, inclusive (local time, see: time), e.g. 2026-10-04T08:30' },
    { sticky: true, name: 'to',      type: 'string', valueName: 'time', description: 'End time, inclusive (local time, see: time)' },
    { sticky: true, name: 'latest', aliases: ['limit'], type: 'number', valueName: 'n', description: 'Number of latest matching records to show (alias --limit)', default: 20 },
    { name: 'summary', type: 'boolean',                    description: 'Show the summary only, no record list' },
    { name: 'export',  type: 'string', valueName: 'path', description: 'Write matching raw lines to a file' },
    { name: 'reset',   type: 'boolean', description: 'Forget the remembered parameters of this command first' },
  ],
  examples: [
    '--trace --dtu 320            (remembered for the next trace)',
    '--trace --latest 10          (still DTU 320, now the latest 10 records)',
    '--trace --reset              (forget the remembered parameters)',
    '--trace --dtu 320,321 --sensor 4 --mode HEART-BEAT',
    '--trace --where DTU.ID=305 --where "HB_NOTE!=NORMAL"',
    '--trace --dtu 305 --from 2026-10-10 --to 2026-10-12 --latest 50',
    '--trace --sensor 0 --summary',
    '--trace --dtu 320 --export dtu320.log',
  ],

  run(ctx) {
    const { opts } = ctx;

    const conds = [];
    if (opts.dtu)    conds.push(makeCondition('DTU.ID', false, parseIdList(opts.dtu, '--dtu')));
    if (opts.sensor) conds.push(makeCondition('SENSOR.ID', false, parseIdList(opts.sensor, '--sensor')));
    if (opts.mode)   conds.push(makeCondition('MODE', false, opts.mode.split(',')));
    for (const w of opts.where || []) conds.push(parseWhere(w));

    const from = opts.from ? parseTime(opts.from, '--from') : null;
    const to   = opts.to   ? parseTime(opts.to, '--to')     : null;
    if (from !== null && to !== null && from > to) throw new CliError('--from must be earlier than --to');

    const filters = [
      ...conds.map((c) => c.label),
      opts.from && `FROM=${opts.from}`,
      opts.to   && `TO=${opts.to}`,
    ].filter(Boolean);

    const files = resolveLogFiles(ctx);
    if (!files.length) return console.log('No .log files found.');

    const exported = [];

    for (const filePath of files) {
      const raw = readLogOrWarn(filePath);
      if (raw === null) continue;

      const { records, total, malformed } = readJsonl(raw);

      // Resolve each key against the keys that really exist in this file (case-insensitive)
      const seen = new Set();
      for (const { o } of records) for (const k of Object.keys(o)) seen.add(k);
      const fileConds = conds.map((c) => {
        const real = seen.has(c.key) ? c.key : [...seen].find((k) => k.toLowerCase() === c.key.toLowerCase());
        return real ? { ...c, key: real } : c;
      });
      const unknown = fileConds.filter((c) => !seen.has(c.key));
      if (unknown.length) {
        console.error(clr.red(`\n\u274C ${path.basename(filePath)}: key not found: ${unknown.map((c) => c.key).join(', ')}`));
        console.error(clr.gray(`   Keys in this file: ${[...seen].join(', ')}`));
        process.exitCode = 1;
        continue;
      }

      const matched = records.filter(({ o }) => {
        for (const c of fileConds) if (!matchCondition(o, c)) return false;
        if (from !== null || to !== null) {
          const ms = Date.parse(o[TIME_KEY]);
          if (Number.isNaN(ms)) return false;
          if (from !== null && ms < from) return false;
          if (to   !== null && ms > to)   return false;
        }
        return true;
      });

      console.log(clr.bold(`\n\u{1F4C4} ${path.basename(filePath)}`));
      console.log(`   ${clr.gray('Filters:')}   ${clr.cyan(filters.length ? filters.join('  ') : '(none)')}`);
      console.log(`   ${clr.gray('Times:')}     ${timeMode === 'utc' ? 'UTC (as stored in the log)' : `local (${tzLabel()})`}`);
      console.log(`   Scanned:   ${total} lines  |  Matched: ${clr.green(matched.length)}${malformed ? `  |  Malformed: ${malformed}` : ''}`);

      if (!matched.length) { console.log(clr.yellow('   No matching records.')); continue; }

      // -- Summaries --
      const byMode = {}, bySensor = {}, byDtu = new Map();
      for (const { o } of matched) {
        if (o.MODE !== undefined) byMode[o.MODE] = (byMode[o.MODE] || 0) + 1;
        if (o['SENSOR.ID'] !== undefined) bySensor[o['SENSOR.ID']] = (bySensor[o['SENSOR.ID']] || 0) + 1;

        const id = o['DTU.ID'];
        if (id === undefined) continue;
        const ts = o[TIME_KEY] || '';
        let d = byDtu.get(id);
        if (!d) byDtu.set(id, (d = { count: 0, first: ts, last: ts, batt: '-', note: '-', hbTs: '' }));
        d.count++;
        if (ts < d.first) d.first = ts;
        if (ts > d.last)  d.last = ts;
        if (o.MODE === 'HEART-BEAT' && ts >= d.hbTs) {
          d.hbTs = ts;
          d.batt = o.BATT ?? '-';
          d.note = o.HB_NOTE ?? '-';
        }
      }

      const fmt = (obj) => Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join('  |  ');
      if (Object.keys(byMode).length)   console.log(`   By mode:   ${fmt(byMode)}`);
      if (Object.keys(bySensor).length) console.log(`   By sensor: ${fmt(bySensor)}`);

      if (byDtu.size) {
        console.log(clr.bold(`\n   ${'DTU'.padEnd(6)}${'RECORDS'.padEnd(9)}${'FIRST SEEN'.padEnd(26)}${'LAST SEEN'.padEnd(26)}${'BATT'.padEnd(6)}LAST HB NOTE`));
        for (const [id, d] of [...byDtu.entries()].sort((a, b) => a[0] - b[0])) {
          console.log(`   ${clr.cyan(String(id).padEnd(6))}${String(d.count).padEnd(9)}${formatTime(d.first).padEnd(26)}${formatTime(d.last).padEnd(26)}${String(d.batt).padEnd(6)}${d.note}`);
        }
      }

      // -- Latest records --
      if (!opts.summary && opts.latest > 0) {
        const shown = matched.slice(-opts.latest);
        console.log(clr.bold(`\n   Latest ${shown.length} of ${matched.length} matching record(s):`));
        for (const { o } of shown) console.log(`   ${recordLine(o)}`);
      }

      if (opts.export) exported.push(...matched.map((m) => m.raw));
    }

    if (opts.export) {
      const outPath = path.resolve(opts.export);
      fs.writeFileSync(outPath, exported.length ? exported.join('\n') + '\n' : '', 'utf8');
      console.log(clr.green(`\n\u{1F4BE} Exported ${exported.length} line(s) to ${outPath}`));
    }
  },
};

/** Prints one page of a numbered file list. Numbers continue across pages. */
function showFileList(files, selected, page, pageSize) {
  const total = files.length;
  if (!total) return console.log('  (none found)');

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = page * pageSize;
  const slice = files.slice(start, start + pageSize);
  const w = Math.max(...slice.map((f) => path.basename(f).length));
  const nw = String(total).length;

  slice.forEach((f, i) => {
    const mark = f === selected ? '*' : ' ';
    const size = fs.existsSync(f) ? fmtSize(fs.statSync(f).size) : 'missing';
    { const row = `  ${mark} ${String(start + i + 1).padStart(nw)}. ${path.basename(f).padEnd(w)}  ${size}`; console.log(mark === '*' ? clr.green(row) : row); }
  });

  if (pages > 1) {
    console.log(clr.bold(`  -- page ${page + 1}/${pages}  (files ${start + 1}-${start + slice.length} of ${total}) --`));
    console.log(clr.gray('  n = next page | p = previous page | page <n> = jump | Space+Enter = next page'));
  }
  if (selected && files.includes(selected)) console.log(clr.gray('  (* = selected)'));
}

// -------------------------------------------------------------
// --status  (which file is selected, what can be selected, how to select)
// -------------------------------------------------------------

const statusCommand = {
  name: 'status',
  description: 'Show the selected file, the .log files available, and how to select one',
  details: [
    'Shows which file is selected, a numbered list of .log files (paged), and how',
    'to select one. Add text to filter by name, e.g.: status IKN',
    'Also shows the last command and the parameters remembered between runs.',
  ],
  usage: '[text] [options]',
  options: [],
  examples: ['--status', 'status IKN        (only files whose name contains IKN)', 'status --dir ./logs'],

  run({ opts, positional, session }) {
    const listing = listLogFiles(opts.dir);
    const dir = listing.dir;
    const filter = positional.join(' ').trim().toLowerCase();
    const files = filter
      ? listing.files.filter((f) => path.basename(f).toLowerCase().includes(filter))
      : listing.files;
    const interactive = Boolean(session && session.interactive);
    const selected = interactive ? session.file : null;
    if (interactive) { session.list = files; session.page = 0; } // `use <number>` follows this list

    console.log(clr.title('\nSELECTED FILE'));
    if (!interactive) {
      console.log('  (one-shot mode: nothing is remembered between runs)');
    } else if (!selected) {
      console.log(clr.yellow('  No file selected yet. Select one before using keys, clean, trace or restore.'));
    } else if (!fs.existsSync(selected)) {
      console.log(`  ${selected}`);
      console.log(clr.red('  WARNING: this file no longer exists. Select another one.'));
    } else {
      const st = fs.statSync(selected);
      console.log(`  ${selected}`);
      console.log(`  ${fmtSize(st.size)}, modified ${formatTime(st.mtime.toISOString())}${timeMode === 'local' ? ` (${tzLabel()})` : ''}`);
      const snap = interactive && session.snapshot && session.snapshot.file === selected ? session.snapshot : null;
      if (snap) {
        console.log(clr.gray(`  loaded ${formatTime(new Date(snap.loadedAt).toISOString())}, ${snap.lines.toLocaleString('en-US')} lines`));
        if (st.size !== snap.size || st.mtimeMs !== snap.mtimeMs) {
          console.log(clr.yellow('  CHANGED on disk since then. Commands read the latest data; type reload to refresh.'));
        }
      }
    }

    if (interactive) {
      console.log(clr.title('\nLAST COMMAND'));
      console.log(`  ${session.last ? clr.green(session.last) : clr.gray('(none yet)')}`);

      console.log(clr.title('\nREMEMBERED PARAMETERS'));
      const entries = Object.entries(session.params || {})
        .map(([name, vals]) => [name, formatParams(COMMANDS.find((c) => c.name === name) || {}, vals)])
        .filter(([, text]) => text);
      if (!entries.length) {
        console.log(clr.gray('  (none) - parameters you give to trace are remembered for the next trace'));
      } else {
        for (const [name, text] of entries) console.log(`  ${clr.cyan(`${name}:`)} ${clr.green(text)}`);
        console.log(clr.gray('  Applied to the next command of the same name. "reset" or "<command> --reset" clears them.'));
      }
    }

    console.log(clr.title(`\nAVAILABLE .log FILES in ${dir}${filter ? `  (name contains "${filter}")` : ''}`));
    showFileList(files, selected, 0, interactive ? PAGE_SIZE : Infinity);

    console.log(clr.title('\nHOW TO SELECT A FILE'));
    if (interactive) {
      console.log('  use <number>    pick from the list above      e.g.  use 1');
      console.log('  use <path>      pick by path                   e.g.  use .logs/_IKN_PATHOLOGY.log');
      console.log('  use off         clear the selection');
      console.log('  Or for a single command only:  trace --file <path> --dtu 320');
    } else {
      console.log('  Add --file <path> to a command:  --trace --file <path> --dtu 320');
      console.log('  Or run with no arguments to enter interactive mode, then use "use <number>".');
    }
    console.log('');
  },
};

// -------------------------------------------------------------
// --restore  (smallest example command - copy this to start a new one)
// -------------------------------------------------------------

const restoreCommand = {
  name: 'restore',
  modifies: true,
  description: 'Restore log files from their .bak backups (made by --clean)',
  details: [
    'Undo for clean. Copies <file>.bak back over <file>, then deletes the backup',
    '(use --keep-backup to keep it). Files without a .bak are skipped.',
  ],
  usage: '[options]',
  options: [
    { name: 'keep-backup', type: 'boolean', description: 'Keep the .bak file after restoring' },
  ],
  examples: ['--restore', '--restore --file .logs/_IKN_PATHOLOGY.log --keep-backup'],

  run(ctx) {
    let restored = 0;
    for (const filePath of resolveLogFiles(ctx)) {
      const backup = `${filePath}.bak`;
      if (!fs.existsSync(backup)) continue;

      fs.copyFileSync(backup, filePath);
      if (!ctx.opts.keepBackup) fs.unlinkSync(backup);
      console.log(clr.green(`♻️  Restored ${path.basename(filePath)}`));
      restored++;
    }
    if (!restored) console.log('No backups found to restore.');
  },
};

// -------------------------------------------------------------
// Command registry - add new commands here v
// -------------------------------------------------------------

const reloadCommand = {
  name: 'reload',
  description: 'Re-read the selected file from disk and show what changed',
  details: [
    'Commands (trace, keys, clean) always read the file fresh from disk. Reload is for',
    'refreshing what you SEE: it re-reads the file, shows how it changed since it was',
    'last loaded (size, lines, newest record) and prints the key summary again.',
  ],
  usage: '[options]',
  options: [],
  examples: ['reload'],

  run(ctx) {
    const { session } = ctx;
    for (const filePath of resolveLogFiles(ctx)) {
      const raw = readLogOrWarn(filePath);
      if (raw === null) continue;

      const now = takeSnapshot(filePath);
      const parsed = readJsonl(raw);
      const before = session && session.snapshot && session.snapshot.file === filePath ? session.snapshot : null;
      const n = (v) => v.toLocaleString('en-US');

      console.log(clr.bold(`\n\u{1F504} Reloaded ${path.basename(filePath)}`));
      if (!before) {
        console.log(`   ${n(now.lines)} lines, ${fmtSize(now.size)}`);
      } else if (now.size === before.size && now.mtimeMs === before.mtimeMs) {
        console.log(clr.green(`   No change since it was loaded at ${formatTime(new Date(before.loadedAt).toISOString())}  (${n(now.lines)} lines)`));
      } else {
        const d = now.lines - before.lines;
        const sd = now.size - before.size;
        console.log(`   Size:    ${fmtSize(before.size)} -> ${fmtSize(now.size)}   (${sd >= 0 ? '+' : '-'}${fmtSize(Math.abs(sd))})`);
        console.log(`   Lines:   ${n(before.lines)} -> ${n(now.lines)}   ${d >= 0 ? clr.green(`(+${n(d)} new)`) : clr.yellow(`(${n(d)})`)}`);
      }

      const newest = parsed.records.reduce((m, r) => (r.o[TIME_KEY] > m ? r.o[TIME_KEY] : m), '');
      if (newest) console.log(`   Newest record: ${formatTime(newest)}${timeMode === 'local' ? ` (${tzLabel()})` : ''}`);

      printKeys(filePath, parsed);

      if (session && session.interactive && filePath === session.file) {
        session.snapshot = now;
        session.seen = null;
      }
    }
  },
};

const COMMANDS = [statusCommand, keysCommand, reloadCommand, cleanCommand, traceCommand, restoreCommand];

// -------------------------------------------------------------
// Entry point
// -------------------------------------------------------------

/** Remembers how the selected file looked when it was last loaded (size, time, line count). */
function takeSnapshot(file) {
  const st = fs.statSync(file);
  const buf = fs.readFileSync(file);
  let lines = 0;
  for (let i = 0; i < buf.length; i++) if (buf[i] === 10) lines++;
  if (buf.length && buf[buf.length - 1] !== 10) lines++;
  return { file, size: st.size, mtimeMs: st.mtimeMs, lines, loadedAt: Date.now() };
}

/** Tells the user (once per change) that the selected file changed on disk. */
function noteFileChange(session) {
  if (!session.file || !session.snapshot || !fs.existsSync(session.file)) return;
  const st = fs.statSync(session.file);
  const seen = session.seen || session.snapshot;
  if (st.size === seen.size && st.mtimeMs === seen.mtimeMs) return;

  const diff = st.size - session.snapshot.size;
  console.log(clr.yellow(`(file changed on disk since it was loaded: ${diff >= 0 ? '+' : '-'}${fmtSize(Math.abs(diff))}. Commands read the latest data; type reload to refresh the key summary)`));
  session.seen = { size: st.size, mtimeMs: st.mtimeMs };
}

/** Turns stored option values back into text, e.g. --dtu 320 --latest 10 */
function formatParams(cmd, values) {
  const defs = new Map((cmd.options || []).map((o) => [toCamel(o.name), o]));
  const q = (x) => (/\s/.test(String(x)) ? `"${x}"` : String(x));
  const parts = [];
  for (const [k, v] of Object.entries(values)) {
    const def = defs.get(k);
    if (!def || v === undefined || v === false) continue;
    if (def.type === 'boolean') parts.push(`--${def.name}`);
    else if (Array.isArray(v)) v.forEach((x) => parts.push(`--${def.name} ${q(x)}`));
    else parts.push(`--${def.name} ${q(v)}`);
  }
  return parts.join(' ');
}

function main(argv, session = {}) {
  const { command, rest } = extractCommand(argv, COMMANDS);
  const defs = [...GLOBAL_OPTIONS, ...(command ? command.options || [] : [])];
  const { opts, positional, given } = parseArgs(rest, defs, COMMANDS);

  if (opts.version) return console.log(VERSION);

  if (opts.help || (!command && !argv.length)) {
    const named = !command && positional[0] && COMMANDS.find((c) => c.name === positional[0]);
    if (command || named) return showCommandHelp(command || named);
    return showGlobalHelp(COMMANDS);
  }

  if (!command) {
    throw new CliError('No command given. Pick one, e.g. --clean or --trace.');
  }

  // Interactive mode: fall back to the file chosen with `use <path>`
  if (session.file && !opts.file && !opts.dir && !positional.length) opts.file = session.file;

  // Interactive mode: options marked `sticky` are remembered between runs
  const sticky = session.interactive ? (command.options || []).filter((o) => o.sticky) : [];
  let store = null;
  if (sticky.length) {
    session.params = session.params || {};
    if (opts.reset) delete session.params[command.name];
    const previous = session.params[command.name] || {};
    store = { ...previous };
    const inherited = {};

    for (const o of sticky) {
      const k = toCamel(o.name);
      if (given[k] !== undefined) store[k] = given[k];
      else if (previous[k] !== undefined) { opts[k] = previous[k]; inherited[k] = previous[k]; }
    }

    const shown = formatParams(command, inherited);
    if (shown) console.log(clr.yellow(`(remembered from earlier: ${shown}   - type reset to clear)`));
    process.exitCode = 0;
  }

  if (session.interactive && !['status', 'reload'].includes(command.name)) noteFileChange(session);

  command.run({ opts, positional, session });

  // clean/restore change the file themselves: refresh the snapshot so it is not reported as an outside change
  if (command.modifies && session.snapshot && session.file && fs.existsSync(session.file)) {
    session.snapshot = takeSnapshot(session.file);
    session.seen = null;
  }

  // Keep the parameters only if the command finished without reporting an error
  if (store && process.exitCode !== 1) session.params[command.name] = store;
  return command.name;
}

// -------------------------------------------------------------
// Interactive mode - run `node .logs/utility.js` once, then stay inside
// -------------------------------------------------------------

/** Splits a typed line into tokens; "double" or 'single' quotes keep spaces together. */
function tokenize(line) {
  const matches = line.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
  return matches.map((t) => t.replace(/["']/g, ''));
}

/** Tab-completion for command flags and options. */
function completer(line) {
  const tokens = tokenize(line);
  const word = /\s$/.test(line) ? '' : tokens[tokens.length - 1] || '';
  const cmd = COMMANDS.find((c) =>
    tokens.some((t) => t === `--${c.name}` || t === c.name || t === `--command:${c.name}`));

  const candidates = cmd
    ? [...(cmd.options || []), ...GLOBAL_OPTIONS].map((o) => `--${o.name}`)
    : [...COMMANDS.map((c) => `--${c.name}`), ...GLOBAL_OPTIONS.map((o) => `--${o.name}`), 'help', 'use', 'reset', 'time', 'color', 'clear', 'exit'];

  const hits = candidates.filter((c) => c.startsWith(word));
  return [hits.length ? hits : candidates, word];
}

function startRepl() {
  const readline = require('readline');
  const session = { file: null, list: [], page: 0, params: {}, last: null, snapshot: null, seen: null, interactive: true };

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, completer });
  const prompt = () => {
    rl.setPrompt(session.file ? `${clr.cyan('utility')} ${clr.gray('[')}${clr.green(path.basename(session.file))}${clr.gray(']')}${clr.cyan('> ')}` : `${clr.cyan('utility> ')}`);
    rl.prompt();
  };

  const totalPages = () => Math.max(1, Math.ceil(session.list.length / PAGE_SIZE));
  const goToPage = (target) => {
    if (!session.list.length) return console.log('No file list yet. Type status first.');
    if (target < 0) return console.log('Already on the first page.');
    if (target >= totalPages()) return console.log('Already on the last page.');
    session.page = target;
    console.log(clr.title('\nAVAILABLE .log FILES'));
    showFileList(session.list, session.file, session.page, PAGE_SIZE);
  };

  console.log(clr.title(`\nLog Utility v${VERSION} - interactive mode`));
  console.log(clr.gray('Type --help (or help) to list commands, exit to quit. Tab completes flags.'));
  console.log(clr.gray('Type status to see the selected file and how to select one.\n'));

  rl.on('line', (line) => {
    let tokens = tokenize(line);
    if (!tokens.length) {
      // Space + Enter on a long file list = next page
      if (line.length && session.list.length > PAGE_SIZE) goToPage(session.page + 1);
      return prompt();
    }

    const first = tokens[0].toLowerCase();
    try {
      if (['exit', 'quit', '--exit', '--quit'].includes(first)) return rl.close();

      if (['clear', 'cls', '--clear'].includes(first)) {
        console.clear();
      } else if (first === 'time') {
        const arg = (tokens[1] || '').toLowerCase();
        if (arg === 'local' || arg === 'utc') timeMode = arg;
        else if (arg) throw new CliError('Usage: time local | time utc');
        const sample = '2026-10-30T23:02:47.832Z';
        console.log(`Times are ${timeMode === 'utc' ? 'shown as stored (UTC)' : `shown in local time (${tzLabel()})`}.`);
        console.log(clr.gray(`Example: ${sample}  ->  ${formatTime(sample)}`));
        console.log(clr.gray('Applies to trace output and to --from / --to.'));
      } else if (first === 'color') {
        const arg = (tokens[1] || '').toLowerCase();
        if (arg === 'on') colorEnabled = true;
        else if (arg === 'off') colorEnabled = false;
        else if (arg) throw new CliError('Usage: color on | color off');
        console.log(`Color is ${colorEnabled ? clr.green('ON') : 'OFF'}.`);
      } else if (first === 'reset') {
        const name = tokens[1];
        if (name) {
          if (!COMMANDS.some((c) => c.name === name)) throw new CliError(`Unknown command: ${name}`);
          delete session.params[name];
          console.log(`Remembered parameters for ${name} cleared.`);
        } else {
          session.params = {};
          console.log('All remembered parameters cleared.');
        }
      } else if (['n', 'next'].includes(first)) {
        goToPage(session.page + 1);
      } else if (['p', 'prev', 'previous'].includes(first)) {
        goToPage(session.page - 1);
      } else if (first === 'page') {
        const n = Number(tokens[1]);
        if (!Number.isInteger(n) || n < 1 || n > totalPages()) throw new CliError(`Pick a page from 1 to ${totalPages()}.`);
        goToPage(n - 1);
      } else if (['use', '--use'].includes(first)) {
        const arg = tokens.slice(1).join(' ');
        if (!arg) {
          main(['--status'], session);
        } else if (['off', 'clear', 'none'].includes(arg.toLowerCase())) {
          session.file = null;
          session.snapshot = null;
          session.seen = null;
          console.log('Selection cleared. No file selected now. Type status, then use <number>.');
        } else {
          let resolved;
          if (/^\d+$/.test(arg)) {
            if (!session.list.length) session.list = listLogFiles().files;
            const n = Number(arg);
            if (n < 1 || n > session.list.length) throw new CliError(`Pick a number from 1 to ${session.list.length} (type status to see the list).`);
            resolved = session.list[n - 1];
          } else {
            resolved = path.resolve(arg);
          }
          if (!fs.existsSync(resolved)) throw new CliError(`File not found: ${resolved}`);
          if (!fs.statSync(resolved).isFile()) throw new CliError(`Not a file: ${resolved}`);
          session.file = resolved;
          console.log(clr.green(`Selected file: ${resolved}`));
          main(['--keys'], session);
          session.snapshot = takeSnapshot(resolved);
          session.seen = null;
          console.log(clr.gray('\nCommands now run on this file. Type keys to show the keys again, status to review, use off to clear.'));
        }
      } else {
        // Allow plain words too: `help`, `clean --dry-run`, `trace --dtu 320`
        if (first === 'help') tokens = ['--help', ...tokens.slice(1)];
        else if (COMMANDS.some((c) => c.name === first)) tokens[0] = `--${first}`;
        else if (!first.startsWith('-')) throw new CliError(`Unknown command: ${tokens[0]}. Type help to list commands.`);
        const ran = main(tokens, session);
        if (ran && ran !== 'status' && process.exitCode !== 1) session.last = line.trim();
      }
    } catch (err) {
      if (err instanceof CliError) console.error(clr.red(`❌ ${err.message}`));
      else console.error(clr.red(`💥 Unexpected error: ${err.message}`));
    }

    process.exitCode = 0; // one failed command must not mark the whole session as failed
    prompt();
  });

  rl.on('close', () => {
    console.log(clr.gray('Bye!'));
    process.exit(0);
  });

  prompt();
}

// -------------------------------------------------------------
// Start-up: no arguments -> interactive mode; with arguments -> run once and exit
// -------------------------------------------------------------

if (require.main === module) {
  const argv = process.argv.slice(2);

  if (!argv.length) {
    startRepl();
  } else {
    try {
      main(argv);
    } catch (err) {
      if (!(err instanceof CliError)) throw err;
      console.error(clr.red(`❌ ${err.message}\n   Run "node .logs/${TOOL} --help" for usage.`));
      process.exitCode = 1;
    }
  }
}

module.exports = { COMMANDS, parseArgs, extractCommand, tokenize, cleanContent, hasEmptyRcvBytes, CliError };