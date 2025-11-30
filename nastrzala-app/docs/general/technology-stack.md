# Technologies

## Frontend

### React
- **Purpose**: UI library for building user interfaces
- **Language**: TypeScript
- **Key Features**:
  - Component-based architecture
  - Virtual DOM for efficient rendering
  - Hooks for state management and side effects
  - Rich ecosystem and community support

### CSS Modules
- **Purpose**: Styling solution with local scope
- **Key Features**:
  - Clear separation between JSX and style files
  - Prevents style conflicts through locally scoped class names
  - Maintains modularity and reusability
  - File naming convention: `Component.module.css`

## Backend

### Node.js
- **Purpose**: JavaScript runtime for server-side application
- **Key Features**:
  - Non-blocking, event-driven architecture
  - NPM ecosystem for package management
  - Efficient handling of concurrent requests
  - TypeScript on both frontend and backend

## Data Transfer

### JSON (JavaScript Object Notation)
- **Purpose**: Data format for client-server communication
- **Key Features**:
  - Lightweight and human-readable
  - Native JavaScript support
  - Easy serialization and deserialization
  - Standard format for REST APIs

## Architecture Overview

```
Frontend (React)     ←→     Backend (Node.js)
   ↓                            ↓
CSS Modules               JSON Data Transfer
   ↓                            ↓
TypeScript                   TypeScript
```

## Development Stack

- **Language**: TypeScript (ES6+)
- **Frontend Framework**: React
- **Backend Runtime**: Node.js
- **Styling**: CSS Modules
- **Data Format**: JSON
- **Architecture**: Client-Server with REST API
