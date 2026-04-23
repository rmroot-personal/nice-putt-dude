# Nice Putt Dude

To start Firebase Emulator:

`firebase emulators:start`

To run app with emulator connection:

`npm run start:emulator`

## ER Diagram

The entity-relationship diagram for the data models lives in [`docs/er-diagram.mmd`](docs/er-diagram.mmd) (Mermaid source) and [`docs/er-diagram.svg`](docs/er-diagram.svg) (rendered SVG).

### Viewing the diagram

- **GitHub / VS Code** – The `.mmd` file renders automatically in the [Mermaid preview extension](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid) and on GitHub (paste the contents into a Markdown fenced code block tagged ` ```mermaid `).
- **SVG** – Open `docs/er-diagram.svg` directly in any browser or image viewer.
- **Mermaid Live Editor** – Paste the contents of `docs/er-diagram.mmd` into [mermaid.live](https://mermaid.live).

### Regenerating the diagram

The diagram is generated from the TypeScript model files in `src/app/models/`.

**Dependencies**

| Package | Purpose |
|---|---|
| `typescript` (already a dev dependency) | Parses `*.model.ts` files via the compiler API |
| `@mermaid-js/mermaid-cli` (dev dependency) | Renders the `.mmd` source to `.svg` via headless Chromium |
| `tsx` (already a dev dependency) | Runs the generator script |

**Steps**

```bash
# Install dependencies (only needed once)
npm install

# Regenerate docs/er-diagram.mmd and docs/er-diagram.svg
npm run generate:er
```

The script (`scripts/generate-er-diagram.ts`):
1. Scans every `*.model.ts` file in `src/app/models/`
2. Extracts interfaces using the TypeScript compiler API
3. Infers relationships from type references and `*Id` naming conventions
4. Writes `docs/er-diagram.mmd`
5. Calls `mmdc` (Mermaid CLI) to render `docs/er-diagram.svg`
