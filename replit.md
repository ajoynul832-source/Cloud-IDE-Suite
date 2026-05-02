# Flutter APK Builder — Cloud IDE System

## Overview

A mobile-first cloud IDE system with two frontends:
1. **Expo mobile app** — for submitting Flutter ZIPs via URL and tracking builds
2. **Web Cloud IDE** — full browser-based code editor supporting 10+ mobile development languages with APK build pipeline

## Architecture

- **Expo Mobile App** (`artifacts/mobile`) — Frontend app at `/` (served via REPLIT_EXPO_DEV_DOMAIN)
- **Web Cloud IDE** (`artifacts/cloud-ide`) — React+Vite IDE at `/ide/`
- **API Server** (`artifacts/api-server`) — Express backend at `/api`
- **Shared API Client** (`lib/api-client-react`) — React Query hooks generated from OpenAPI spec

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (available, not used for builds — jobs are in-memory)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Mobile**: Expo SDK 54, Expo Router, React Native 0.81.5

## Cloud IDE Features (`artifacts/cloud-ide`)

- **CodeMirror 6 editor** with syntax highlighting for 15+ languages
- **Multi-tab editor** with localStorage-based file persistence
- **File tree** with folder grouping, language icons, inline rename, create/delete
- **Project templates** for 10 mobile stacks (see below)
- **APK Build pipeline**: zips files in-browser → uploads to `/api/build` → polls status → streams logs
- **Resizable panels**: file tree, editor, preview/log panel
- **Language badge** in toolbar shows detected language of active file

### Supported Languages (CodeMirror 6)

| Language | Extension | Package |
|----------|-----------|---------|
| Dart/Flutter | .dart | JS fallback |
| Kotlin | .kt, .kts | @codemirror/lang-java |
| Java | .java | @codemirror/lang-java |
| Swift | .swift | JS fallback |
| Python | .py | @codemirror/lang-python |
| C# | .cs | @codemirror/lang-cpp |
| C/C++ | .c/.cpp/.h | @codemirror/lang-cpp |
| Rust | .rs | @codemirror/lang-rust |
| Go | .go | @codemirror/lang-go |
| JavaScript/JSX | .js/.jsx | @codemirror/lang-javascript |
| TypeScript/TSX | .ts/.tsx | @codemirror/lang-javascript |
| HTML | .html | @codemirror/lang-html |
| CSS/SCSS | .css | @codemirror/lang-css |
| JSON | .json | @codemirror/lang-json |
| XML | .xml | @codemirror/lang-xml |
| Markdown | .md | @codemirror/lang-markdown |

### Project Templates

| Template | Language | Framework |
|----------|----------|-----------|
| Flutter | Dart | Flutter SDK |
| React Native (TypeScript) | TypeScript | React Native 0.73 |
| Android Kotlin | Kotlin | Android SDK |
| Android Java | Java | Android SDK |
| iOS Swift | Swift | SwiftUI |
| Python Kivy | Python | Kivy + buildozer |
| .NET MAUI | C# | .NET 8 |
| Ionic / Capacitor | TypeScript | Ionic Angular |
| Rust Tauri Mobile | Rust | Tauri 2.0 |
| Go gomobile | Go | golang.org/x/mobile |
| C++ NDK | C++ | Android NDK |

## Core API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/build` | Upload Flutter ZIP, queue APK build |
| GET | `/api/status/:jobId` | Poll build status (queued/building/success/failed) |
| GET | `/api/download/:jobId` | Download compiled APK |
| GET | `/api/logs/:jobId` | Fetch build stdout/stderr logs |
| GET | `/api/healthz` | Health check |

## Build Pipeline

1. Accepts multipart/form-data with ZIP file (max 10MB)
2. Extracts ZIP to `/tmp/project_{jobId}`
3. Validates Flutter structure (pubspec.yaml + lib/main.dart)
4. Runs `flutter pub get` then `flutter build apk --debug`
5. Returns APK from `/tmp/project_{jobId}/build/app/outputs/flutter-apk/app-debug.apk`
6. Jobs cleaned up after 30 minutes

## Mobile App Features

- **Build tab**: Paste a public ZIP URL → fetches ZIP → uploads to API → shows live logs + status
- **History tab**: Persists past build jobs in AsyncStorage
- **Job Detail screen**: Full logs + download button for any historical job

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Flutter SDK Requirement

The build pipeline requires Flutter SDK, Android SDK, and Java to be installed on the server. These must be added to PATH:
- `flutter doctor` — verify Flutter installation
- `flutter build apk` — compile to APK

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
