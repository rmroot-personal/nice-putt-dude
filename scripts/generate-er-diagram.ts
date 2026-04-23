#!/usr/bin/env tsx
/**
 * Generates an ER diagram from all *.model.ts files in src/app/models.
 *
 * Outputs:
 *   docs/er-diagram.mmd  – Mermaid ERD source
 *   docs/er-diagram.svg  – rendered SVG (via @mermaid-js/mermaid-cli)
 *
 * Usage: npm run generate:er
 */

import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MODELS_DIR = path.join(ROOT, 'src/app/models');
const DOCS_DIR = path.join(ROOT, 'docs');
const MMD_FILE = path.join(DOCS_DIR, 'er-diagram.mmd');
const SVG_FILE = path.join(DOCS_DIR, 'er-diagram.svg');

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

interface Field {
  name: string;
  type: string;
  isArray: boolean;
  isPK: boolean;
  isFK: boolean;
  fkTarget?: string;
}

interface Entity {
  name: string;
  rawName: string;
  fields: Field[];
  extendsFrom?: string;
}

interface Relationship {
  from: string;
  to: string;
  fromCardinality: string;
  toCardinality: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip the conventional "I" prefix from interface names (IUser → User). */
function stripIPrefix(name: string): string {
  return /^I[A-Z]/.test(name) ? name.slice(1) : name;
}

/**
 * Extract the text of a TypeReference name (handles dotted names like `a.b`).
 * Works without needing a SourceFile object.
 */
function typeRefName(node: ts.EntityName): string {
  if (ts.isIdentifier(node)) return node.text;
  return `${typeRefName(node.left)}.${node.right.text}`;
}

/**
 * Resolve a TypeNode to a simplified { type, isArray } descriptor.
 *
 * Special case: an inline TypeLiteralNode whose members all share the same
 * type (e.g. `{ hole1: GolfHole; …; hole18: GolfHole }`) is treated as an
 * array of that element type so the ER diagram shows a clean composition
 * relationship instead of 18 individual fields.
 */
function resolveType(typeNode: ts.TypeNode): { type: string; isArray: boolean } {
  // T[]
  if (ts.isArrayTypeNode(typeNode)) {
    const inner = resolveType(typeNode.elementType);
    return { type: inner.type, isArray: true };
  }
  // Array<T>
  if (ts.isTypeReferenceNode(typeNode)) {
    const name = typeRefName(typeNode.typeName);
    if (name === 'Array' && typeNode.typeArguments?.length) {
      return { type: resolveType(typeNode.typeArguments[0]).type, isArray: true };
    }
    return { type: name, isArray: false };
  }
  // string | null  →  string
  if (ts.isUnionTypeNode(typeNode)) {
    const nonNull = typeNode.types.filter(
      (t) =>
        t.kind !== ts.SyntaxKind.NullKeyword && t.kind !== ts.SyntaxKind.UndefinedKeyword,
    );
    if (nonNull.length === 1) return resolveType(nonNull[0]);
    // For compound unions just report as string
    return { type: 'string', isArray: false };
  }
  // Inline object literal – detect "repeated element" pattern
  if (ts.isTypeLiteralNode(typeNode)) {
    const memberTypes = typeNode.members
      .filter((m): m is ts.PropertySignature => ts.isPropertySignature(m) && !!m.type)
      .map((m) => resolveType(m.type!).type);
    const unique = [...new Set(memberTypes)];
    if (unique.length === 1 && unique[0] !== 'object') {
      return { type: unique[0], isArray: true };
    }
    return { type: 'object', isArray: false };
  }
  // Primitives
  switch (typeNode.kind) {
    case ts.SyntaxKind.StringKeyword:
      return { type: 'string', isArray: false };
    case ts.SyntaxKind.NumberKeyword:
      return { type: 'int', isArray: false };
    case ts.SyntaxKind.BooleanKeyword:
      return { type: 'boolean', isArray: false };
    default:
      return { type: 'string', isArray: false };
  }
}

// ---------------------------------------------------------------------------
// Parse model files → Entity[]
// ---------------------------------------------------------------------------

function parseModels(files: string[]): Entity[] {
  const program = ts.createProgram(files, { target: ts.ScriptTarget.ESNext });
  const entities: Entity[] = [];

  for (const file of files) {
    const src = program.getSourceFile(file);
    if (!src) continue;

    ts.forEachChild(src, (node) => {
      if (!ts.isInterfaceDeclaration(node)) return;

      const rawName = node.name.text;
      const displayName = stripIPrefix(rawName);

      const extendsFrom = node.heritageClauses
        ?.flatMap((c) =>
          c.types.map((t) => (ts.isIdentifier(t.expression) ? t.expression.text : null)),
        )
        .find((n): n is string => n !== null);

      const fields: Field[] = [];

      for (const member of node.members) {
        if (!ts.isPropertySignature(member) || !member.name || !member.type) continue;
        const fieldName = ts.isIdentifier(member.name)
          ? member.name.text
          : member.name.getText();
        const { type, isArray } = resolveType(member.type);

        // Skip unresolved inline objects
        if (type === 'object') continue;

        const isPK = fieldName === 'id' || fieldName === 'uid';

        fields.push({ name: fieldName, type, isArray, isPK, isFK: false });
      }

      entities.push({ name: displayName, rawName, fields, extendsFrom });
    });
  }

  return entities;
}

// ---------------------------------------------------------------------------
// Infer relationships
// ---------------------------------------------------------------------------

function inferRelationships(entities: Entity[]): Relationship[] {
  const rels: Relationship[] = [];

  // Build lookup: lowercase name/rawName → Entity
  const byName = new Map<string, Entity>();
  for (const e of entities) {
    byName.set(e.name.toLowerCase(), e);
    byName.set(e.rawName.toLowerCase(), e);
  }

  /**
   * Try to resolve a string hint to a known entity.
   * Supports direct matches and substring matches (e.g. "course" → GolfCourse).
   */
  function findEntity(hint: string): Entity | undefined {
    const lower = hint.toLowerCase();
    if (byName.has(lower)) return byName.get(lower);
    for (const [key, entity] of byName) {
      if (key.includes(lower) || lower.includes(key)) return entity;
    }
    return undefined;
  }

  // Track already-added entity pairs so we don't duplicate type-ref edges
  const typeRefSeen = new Set<string>();

  for (const entity of entities) {
    // Inheritance
    if (entity.extendsFrom) {
      const parent = findEntity(entity.extendsFrom);
      if (parent) {
        rels.push({
          from: parent.name,
          to: entity.name,
          fromCardinality: '||',
          toCardinality: '||',
          label: 'extends',
        });
      }
    }

    for (const field of entity.fields) {
      // --- 1. Field type is a known entity (composition / aggregation) ---
      const typeTarget = findEntity(field.type);
      if (typeTarget && typeTarget.name !== entity.name) {
        // Always annotate the field as an FK reference, even for duplicates
        field.isFK = true;
        field.fkTarget = typeTarget.name;

        const pairKey = `${entity.name}→${typeTarget.name}`;
        if (!typeRefSeen.has(pairKey)) {
          typeRefSeen.add(pairKey);
          rels.push({
            from: entity.name,
            to: typeTarget.name,
            fromCardinality: '||',
            toCardinality: field.isArray ? 'o{' : '||',
            label: field.isArray ? `contains ${field.name}` : field.name,
          });
        }
        continue;
      }

      // --- 2. FK naming convention: string field ending in "Id" / "Ids" ---
      if (field.type === 'string' && !field.isPK) {
        const idSuffix =
          field.name.endsWith('Ids') ? 'Ids'
          : field.name.endsWith('Id') ? 'Id'
          : null;

        if (idSuffix) {
          const prefix = field.name.slice(0, -idSuffix.length); // e.g. "userId" → "user"
          // Try several variations to find the referenced entity
          const candidates = [
            prefix,
            prefix.replace(/\d+$/, ''), // strip trailing digit: user1 → user
            prefix.replace(/^(from|to|createdBy|by)([A-Z])/, (_, _p, c: string) => c.toLowerCase()), // fromUser → user
          ];
          let target: Entity | undefined;
          for (const c of candidates) {
            if (!c) continue;
            target = findEntity(c);
            if (target) break;
          }
          if (target && target.name !== entity.name) {
            field.isFK = true;
            field.fkTarget = target.name;
            rels.push({
              from: entity.name,
              to: target.name,
              fromCardinality: '||',
              toCardinality: '||',
              label: field.name,
            });
          }
        }
      }
    }
  }

  return rels;
}

// ---------------------------------------------------------------------------
// Generate Mermaid ERD text
// ---------------------------------------------------------------------------

const MERMAID_TYPES: Record<string, string> = {
  string: 'string',
  int: 'int',
  number: 'int',
  boolean: 'boolean',
  date: 'date',
  Date: 'date',
};

function toMermaidType(t: string): string {
  return MERMAID_TYPES[t] ?? 'string';
}

function buildMermaid(entities: Entity[], relationships: Relationship[]): string {
  const lines: string[] = ['erDiagram', ''];

  for (const entity of entities) {
    lines.push(`    ${entity.name} {`);
    for (const field of entity.fields) {
      // Use the FK target entity name as the attribute type when available;
      // otherwise map the primitive type to its Mermaid equivalent.
      const type = field.fkTarget ?? toMermaidType(field.type);
      const pk = field.isPK ? ' PK' : '';
      const fk = field.isFK && !field.isPK ? ' FK' : '';
      lines.push(`        ${type} ${field.name}${pk}${fk}`);
    }
    lines.push('    }');
    lines.push('');
  }

  // Deduplicate by full signature
  const seen = new Set<string>();
  for (const rel of relationships) {
    const sig = `${rel.from}|${rel.from}${rel.fromCardinality}--${rel.toCardinality}${rel.to}|${rel.label}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    lines.push(
      `    ${rel.from} ${rel.fromCardinality}--${rel.toCardinality} ${rel.to} : "${rel.label}"`,
    );
  }

  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const modelFiles = fs
  .readdirSync(MODELS_DIR)
  .filter((f) => f.endsWith('.model.ts'))
  .map((f) => path.join(MODELS_DIR, f));

console.log(`Parsing ${modelFiles.length} model file(s)…`);

const entities = parseModels(modelFiles);
console.log(`  Found entities: ${entities.map((e) => e.name).join(', ')}`);

const relationships = inferRelationships(entities);
console.log(`  Inferred ${relationships.length} relationship(s)`);

const mermaidSource = buildMermaid(entities, relationships);

fs.mkdirSync(DOCS_DIR, { recursive: true });
fs.writeFileSync(MMD_FILE, mermaidSource, 'utf8');
console.log(`✓ Written ${path.relative(ROOT, MMD_FILE)}`);

// Generate SVG using mmdc (bundled via @mermaid-js/mermaid-cli)
const mmdc = path.join(ROOT, 'node_modules', '.bin', 'mmdc');
if (fs.existsSync(mmdc)) {
  // Write a temporary puppeteer config that disables the sandbox (needed in
  // some CI / container environments where unprivileged user namespaces are
  // restricted).
  const puppeteerCfg = path.join(DOCS_DIR, '.puppeteer-cfg.json');
  fs.writeFileSync(puppeteerCfg, JSON.stringify({ args: ['--no-sandbox'] }), 'utf8');
  try {
    execSync(
      `"${mmdc}" -i "${MMD_FILE}" -o "${SVG_FILE}" --backgroundColor white -p "${puppeteerCfg}"`,
      { stdio: 'inherit' },
    );
    console.log(`✓ Written ${path.relative(ROOT, SVG_FILE)}`);
  } catch (err) {
    console.error('mmdc failed to render SVG. See error above.');
    process.exit(1);
  } finally {
    fs.rmSync(puppeteerCfg, { force: true });
  }
} else {
  console.warn('⚠ mmdc not found – install @mermaid-js/mermaid-cli to also generate the SVG.');
}
