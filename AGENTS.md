# AGENTS.md

## Project Overview

React + TypeScript + Vite app using `@react-three/fiber` for Three.js rendering.

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Type-check (`tsc -b`) then build (`vite build`)
- `npm run lint` — Run ESLint
- `npm run preview` — Preview production build

## Key Files

- `src/main.tsx` — App entry point
- `src/App.tsx` — Main component with Three.js Canvas
- `vite.config.ts` — Vite config (React plugin only)
- `tsconfig.json` — Project references to `tsconfig.app.json` and `tsconfig.node.json`

## TypeScript

- Two configs: `tsconfig.app.json` (src) and `tsconfig.node.json` (vite.config.ts)
- Strict mode: `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly` enabled
- Run `tsc -b` for full type-check (part of `npm run build`)

## ESLint

- Flat config in `eslint.config.js`
- Uses: `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `typescript-eslint`
- Run `npm run lint` before commits

## Three.js

- Uses `@react-three/fiber` (React renderer for Three.js)
- Basic scene in `App.tsx`: Canvas and scene
