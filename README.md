# React Insight

> A TypeScript-first, plugin-based runtime for building React debugging and inspection tools.

[![CI](https://github.com/afraz-saeed1986/react-insight/actions/workflows/ci.yml/badge.svg)](https://github.com/afraz-saeed1986/react-insight/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Node.js](https://img.shields.io/badge/node-%3E%3D22-339933)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6)

> ⚠️ **React Insight is under active development.**  
> **Phase 1 — Core** is complete. React integration is planned for **Phase 2**.

---

# Overview

React Insight is an open-source toolkit for building powerful debugging and inspection tools for React applications.

Instead of being a monolithic DevTools extension, React Insight is designed around a lightweight, extensible, plugin-based runtime that can power developer tools, inspectors, timelines, analytics, and custom integrations.

The project is built with a strong focus on:

- TypeScript-first API
- Plugin architecture
- Runtime safety
- Excellent developer experience
- Production-grade quality
- Modern tooling

---

# Features

## Core

- ✅ Plugin-based Runtime
- ✅ Generic TypeScript API
- ✅ Strongly typed event system
- ✅ Runtime lifecycle management
- ✅ Safe plugin destruction
- ✅ Atomic plugin registration
- ✅ Built-in Logger Plugin

## Quality

- ✅ TypeScript Strict Mode
- ✅ Shared ESLint Flat Config
- ✅ Vitest
- ✅ Coverage thresholds
- ✅ GitHub Actions CI
- ✅ Automated Quality Gate

## Architecture

- ✅ Monorepo (pnpm Workspace)
- ✅ ESM-first package
- ✅ Tree-shaking friendly
- ✅ Zero runtime dependencies (except `mitt`)

---

# Installation

> The package is not published to npm yet.

When published:

```bash
npm install @react-insight/core
```

or

```bash
pnpm add @react-insight/core
```

---

# Quick Start

```ts
import { Runtime, loggerPlugin } from "@react-insight/core";

const runtime = new Runtime();

await runtime.registerPlugin(loggerPlugin());

runtime.destroy();
```

---

# Project Structure

```
packages
│
├── core
├── playground
└── eslint-config
```

- **core** — Runtime and plugin system
- **playground** — Integration environment
- **eslint-config** — Shared ESLint configuration

---

# Architecture

```
Runtime
   │
   ├── PluginManager
   ├── EventBus
   └── PluginContext
            │
            ▼
       InsightPlugin
```

The Runtime owns the plugin lifecycle.

Plugins communicate only through `PluginContext`.

---

# Quality

Every change must successfully pass:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm --filter @react-insight/core test --coverage
```

These checks are automatically executed by GitHub Actions.

---

# Roadmap

## ✅ Phase 1 — Core

- Runtime
- Plugin System
- EventBus
- Playground
- Testing
- CI
- Documentation

## 🚧 Phase 2 — React

- React package
- createInsight()
- Root registration
- Component tracking
- Hook tracking

## 🔜 Phase 3 — Inspector

- DevTools
- Timeline
- Inspector
- Session management

---

# Contributing

Contributions, ideas and discussions are welcome.

Before opening a Pull Request, please ensure:

- All tests pass
- Lint passes
- Type checking passes
- Coverage thresholds remain satisfied

---

# Development

Clone the repository:

```bash
git clone https://github.com/afraz-saeed1986/react-insight.git
```

Install dependencies:

```bash
pnpm install
```

Build:

```bash
pnpm build
```

Run Playground:

```bash
pnpm dev
```

Run tests:

```bash
pnpm test
```

---

# Documentation

Additional project documentation is available in:

- `ARCHITECTURE.md`
- `ROADMAP.md`
- `PROJECT_CONTEXT.md`
- `DECISIONS.md`
- `CHANGELOG.md`

---

# License

MIT © React Insight Contributors
