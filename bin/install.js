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
      'skills/concept',
      'skills/calcpad',
      'skills/simulate',
      'skills/setup',
      'agents',
      'librespin/templates',
    ];
    for (const dir of dirs) {
      await mkdir(join(targetBase, dir), { recursive: true });
    }

    // Copy skill directories (recursive)
    await cp(
      join(sourceBase, 'skills', 'concept'),
      join(targetBase, 'skills', 'concept'),
      { recursive: true, force: true }
    );
    await cp(
      join(sourceBase, 'skills', 'calcpad'),
      join(targetBase, 'skills', 'calcpad'),
      { recursive: true, force: true }
    );
    await cp(
      join(sourceBase, 'skills', 'simulate'),
      join(targetBase, 'skills', 'simulate'),
      { recursive: true, force: true }
    );
    await cp(
      join(sourceBase, 'skills', 'setup'),
      join(targetBase, 'skills', 'setup'),
      { recursive: true, force: true }
    );
    console.log('  ✓ Skills installed (concept, calcpad, simulate, setup)');

    // Copy agent flat files
    await cp(
      join(sourceBase, 'agents', 'concept.md'),
      join(targetBase, 'agents', 'concept.md'),
      { force: true }
    );
    await cp(
      join(sourceBase, 'agents', 'calcpad.md'),
      join(targetBase, 'agents', 'calcpad.md'),
      { force: true }
    );
    await cp(
      join(sourceBase, 'agents', 'simulate.md'),
      join(targetBase, 'agents', 'simulate.md'),
      { force: true }
    );
    console.log('  ✓ Agents installed (concept, calcpad, simulate)');

    // Copy templates directory (recursive)
    await cp(
      join(sourceBase, 'skills', 'concept', 'templates'),
      join(targetBase, 'librespin', 'templates'),
      { recursive: true, force: true }
    );
    console.log('  ✓ Templates installed');

    console.log(`\n✓ Installation complete!`);
    console.log(`\nFiles installed to: ${targetBase}`);
    if (!isLocal) {
      console.log('\nRestart Claude Code to activate /librespin:concept, /librespin:calcpad, /librespin:simulate, and /librespin:setup skills.');
    }
  } catch (err) {
    console.error('\n✗ Installation failed:', err.message);
    process.exit(1);
  }
}

const INSTALL_ITEMS = [
  { path: join('skills', 'concept'), recursive: true },
  { path: join('skills', 'calcpad'), recursive: true },
  { path: join('skills', 'simulate'), recursive: true },
  { path: join('skills', 'setup'), recursive: true },
  { path: join('agents', 'concept.md'), recursive: false },
  { path: join('agents', 'calcpad.md'), recursive: false },
  { path: join('agents', 'simulate.md'), recursive: false },
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
