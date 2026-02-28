# Timlyzer

> **Automatic time tracking application** built with Tauri, React, and Tailwind CSS

![Tauri](https://img.shields.io/badge/Tauri-2.x-FFC131?logo=tauri)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)

## Features

- ✅ **Automatic Tracking** - Tracks active applications and window titles
- ✅ **Timeline Visualization** - Interactive timeline with 3 tracks (Task/Status/App)
- ✅ **System State Monitoring** - Online/Idle/Offline status tracking
- ✅ **Usage Statistics** - Daily usage summary and charts
- ✅ **Search & Export** - Search history and export data
- ✅ **System Tray** - Background operation with quick access
- ✅ **Dark/Light Theme** - Automatic theme switching
- ✅ **Cross-Platform** - Works on Windows, macOS, and Linux

## Tech Stack

| Category              | Technology            |
| --------------------- | --------------------- |
| **Desktop Framework** | Tauri 2.x (Rust)      |
| **Frontend**          | React 19 + TypeScript |
| **Styling**           | Tailwind CSS 4        |
| **State Management**  | Zustand               |
| **Database**          | SQLite (rusqlite)     |
| **Charts**            | Recharts              |

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://www.rust-lang.org/) (stable)
- [pnpm](https://pnpm.io/) 8+

### Setup

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm tauri dev

# Build for production
pnpm tauri build
```

### Project Structure

```
timlyzer/
├── src/                        # Frontend (React)
│   ├── components/             # React components
│   │   ├── layout/             # Layout components
│   │   ├── timeline/           # Timeline components
│   │   └── ui/                 # Base UI components
│   ├── pages/                  # Page components
│   ├── stores/                 # Zustand stores
│   ├── services/               # Tauri API services
│   ├── types/                  # TypeScript types
│   └── lib/                    # Utilities
├── src-tauri/                  # Backend (Rust)
│   ├── src/
│   │   ├── main.rs             # Entry point
│   │   ├── lib.rs              # App initialization
│   │   ├── commands.rs         # Tauri commands
│   │   └── database.rs         # SQLite database
│   ├── Cargo.toml              # Rust dependencies
│   └── tauri.conf.json         # Tauri configuration
├── docs/                       # Documentation
└── package.json                # Node.js dependencies
```

## Documentation

See the [docs](./docs/) directory for detailed documentation:

- [Architecture](./docs/01-new-architecture.md) - System architecture
- [Implementation Plan](./docs/02-implementation-plan.md) - Development roadmap
- [Tauri Research](./docs/03-tauri-research.md) - Tauri best practices
- [Feature Spec](./docs/04-feature-spec.md) - Feature requirements
- [UI Design](./docs/05-ui-design-spec.md) - Design system

## License

MIT License

---

_Built with ❤️ using Tauri, React, and Tailwind CSS_
