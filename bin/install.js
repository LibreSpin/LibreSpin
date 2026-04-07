#!/usr/bin/env node
// LibreSpin installer - copies skill pack files to Claude Code directory

import { cp, mkdir, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse arguments
const args = process.argv.slice(2);
const isLocal = args.includes('--local');
const isUninstall = args.includes('--uninstall');
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  console.log(`
Usage: npx librespin-install [options]

Install LibreSpin skill pack for Claude Code.

Options:
  --local      Install to current directory (.claude/) instead of home (~/.claude/)
  --uninstall  Remove LibreSpin files from the install target
  --help       Show this help message

Examples:
  npx librespin-install                      # Install to ~/.claude/
  npx librespin-install --local              # Install to ./.claude/
  npx librespin-install --uninstall          # Remove from ~/.claude/
  npx librespin-install --uninstall --local  # Remove from ./.claude/
  `);
  process.exit(0);
}

// Determine installation target
const targetBase = isLocal
  ? join(process.cwd(), '.claude')
  : join(homedir(), '.claude');
const sourceBase = join(__dirname, '..');

async function install() {
  console.log(`Installing LibreSpin to ${targetBase}...\n`);

  try {
    // Create target directories before copying
    const dirs = [
      'skills/librespin-concept',
      'agents',
      'librespin/templates',
    ];
    for (const dir of dirs) {
      await mkdir(join(targetBase, dir), { recursive: true });
    }

    // Copy skill directory (recursive)
    await cp(
      join(sourceBase, 'skills', 'librespin-concept'),
      join(targetBase, 'skills', 'librespin-concept'),
      { recursive: true, force: true }
    );
    console.log('  ✓ Skill installed');

    // Copy agent flat file (not a directory)
    await cp(
      join(sourceBase, 'agents', 'librespin-concept.md'),
      join(targetBase, 'agents', 'librespin-concept.md'),
      { force: true }
    );
    console.log('  ✓ Agent installed');

    // Copy templates directory (recursive)
    await cp(
      join(sourceBase, 'librespin', 'templates'),
      join(targetBase, 'librespin', 'templates'),
      { recursive: true, force: true }
    );
    console.log('  ✓ Templates installed');

    console.log(`\n✓ Installation complete!`);
    console.log(`\nFiles installed to: ${targetBase}`);
    if (!isLocal) {
      console.log('\nRestart Claude Code to activate /librespin:concept skill.');
    }
  } catch (err) {
    console.error('\n✗ Installation failed:', err.message);
    process.exit(1);
  }
}

const INSTALL_ITEMS = [
  { path: join('skills', 'librespin-concept'), recursive: true },
  { path: join('agents', 'librespin-concept.md'), recursive: false },
  { path: join('librespin', 'templates'), recursive: true },
];

async function uninstall() {
  console.log(`Uninstalling LibreSpin from ${targetBase}...\n`);
  try {
    for (const item of INSTALL_ITEMS) {
      const target = join(targetBase, item.path);
      await rm(target, { recursive: item.recursive, force: true });
      console.log(`  ✓ Removed ${item.path}`);
    }
    console.log(`\n✓ Uninstall complete.`);
  } catch (err) {
    console.error('\n✗ Uninstall failed:', err.message);
    process.exit(1);
  }
}

if (isUninstall) {
  uninstall();
} else {
  install();
}
