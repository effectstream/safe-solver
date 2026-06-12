# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Safe Solver is a TypeScript on-chain turn-based game built with the Paima Engine framework. It syncs state across EVM (Hardhat/Arbitrum) and Midnight (privacy) blockchains. It also serves as a template for building on-chain games.

## Commands

```bash
# Initial setup
bun install && ./patch.sh

# Compile contracts
bun run build:evm
bun run build:midnight

# Full-stack dev (launches tmux TUI with 10+ processes: chains, indexer, proof server, batcher, backend, frontend)
bun run dev

# Type-check all backend entry points
bun run check

# Regenerate TypeScript bindings after modifying SQL migrations or queries
bun run build:pgtypes

# Frontend only (separate npm project)
cd packages/frontend && bun install && bun run dev

# Deploy contracts to testnet (edit hardhat.config.ts network section first)
cd packages/shared/contracts/evm-contracts && bun run deploy:testnet

# Run against testnet/mainnet
bun run preview
bun run mainnet
```

Dev URLs: Frontend http://localhost:5173, Backend API http://localhost:8000, Explorer http://localhost:10590

## Architecture

**Runtime:** Bun workspaces for backend packages, npm/bun for frontend. Not using Turborepo/Lerna.

**Core data flow:**
1. User sends transaction -> EVM contract (or Midnight contract)
2. Paima Engine syncs both chains via parallel sync protocols (NTP + EVM RPC + Midnight indexer)
3. State transitions execute as Effection generator functions in the state machine
4. Database updated via pgtyped prepared queries
5. Frontend polls API for game state

**Key extension points (the files you'll modify to build a new game):**

| What to change | File |
|---|---|
| Game commands (grammar) | `packages/shared/data-types/src/grammar.ts` |
| On-chain logic (state transitions) | `packages/client/node/src/state-machine.ts` |
| Game API endpoints | `packages/client/node/src/api.game.ts` |
| Common API endpoints (leaderboard, achievements) | `packages/client/node/src/api.common.ts` |
| Database schema | `packages/client/database/src/migrations/database.sql` |
| Database queries | `packages/client/database/src/sql/game-queries.sql` |
| Frontend | `packages/frontend/src/` |
| EVM contract | `packages/shared/contracts/evm-contracts/src/contracts/effectstreaml2.sol` |
| Midnight contract | `packages/shared/contracts/midnight-contracts/` |
| Sync config (chain primitives) | `packages/client/node/src/config.*.ts` |

**State machine pattern:** State transitions are generator functions using `yield* World.resolve(dbFunction, params)` for async database calls via Effection coroutines. Each grammar command maps to a handler function.

**Dual-chain model:** EVM handles public game actions; Midnight handles private/encrypted game data via Compact language contracts and a ledger.

## Packages

| Package | Runtime | Purpose |
|---|---|---|
| `@safe-solver/node` | Bun | Effectstream runtime, state machine, Fastify API server |
| `@safe-solver/database` | Bun | SQL migrations, pgtyped query bindings |
| `@safe-solver/batcher` | Bun | Midnight blockchain transaction batcher |
| `@safe-solver/data-types` | Bun | Grammar definitions, per-environment config |
| `@safe-solver/evm-contracts` | Bun | Solidity contracts (Hardhat 3 + Ignition) |
| `@safe-solver/midnight-contracts` | Bun | Midnight Compact privacy contracts |
| `game-1` (frontend) | Bun/npm | Three.js 3D game UI, wallet integration (Vite) |

## Key Dependencies

- **Effectstream** (`@effectstream/*` 0.100.21): Blockchain sync, state machine framework, orchestrator
- **Effection**: Structured concurrency / coroutine framework for async operations
- **pgtyped**: Type-safe SQL query generation
- **@sinclair/typebox**: Runtime schema validation (API + grammar)
- **Fastify**: HTTP API server
- **Three.js + Vite**: Frontend 3D rendering and build
- **Hardhat 3.0.4 + Ignition**: EVM contract compilation and deployment
- **Compact 0.27.0**: Midnight privacy contract language

## Environment

- Dev database: PGLite (in-memory, auto-created). Production: PostgreSQL via connection string.
- Env files: `packages/client/node/.env.dev`, `.env.testnet`, `.env.preview`, `.env.mainnet`
- System deps: Bun, Node.js, Compact 0.27.0, Forge (Foundry)
