# Flutter APK Builder — Cloud IDE System

## Overview

A mobile-first cloud IDE system that allows users to submit Flutter projects (as ZIP files) and compile real Android APKs on the server. The Expo mobile app provides a sleek dark-terminal interface for uploading, tracking builds, and downloading APKs.

## Architecture

- **Expo Mobile App** (`artifacts/mobile`) — Frontend app at `/` (served via REPLIT_EXPO_DEV_DOMAIN)
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
