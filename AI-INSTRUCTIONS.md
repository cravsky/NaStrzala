# AI Agent Instructions

## Project Context
This is a van cargo fitting application that helps users determine if their cargo will fit in various delivery vans. The application uses React for the frontend and Node.js for the backend.

## Technology Stack
- **Frontend**: React with pure JavaScript (no TypeScript)
- **Backend**: Node.js
- **Styling**: CSS Modules for clear separation between JSX and style files
- **Data Transfer**: JSON format
- **Development Environment**: Visual Studio Code on Windows

## Project Structure
```
nastrzala-app/
├── src/
│   ├── components/
│   │   ├── ComponentName/
│   │   │   ├── ComponentName.jsx
│   │   │   └── ComponentName.module.css
│   ├── data/
│   │   ├── vehicles/
│   │   │   ├── vehicle-name.json
│   │   │   └── index.js
│   │   └── cargo/
│   │       └── cargo-type.json
│   └── App.jsx
```

## Coding Standards

### Component Structure
- Each component must be in its own folder under `src/components/`
- Folder name matches component name (PascalCase)
- Contains both `.jsx` file and `.module.css` file
- Example: `CargoSelector/CargoSelector.jsx` and `CargoSelector/CargoSelector.module.css`

### Naming Conventions
- **Components**: PascalCase (e.g., `VanSelector`, `DimensionsDialog`)
- **CSS Modules**: `ComponentName.module.css`
- **Data files**: kebab-case with `.json` extension (e.g., `euro-pallet.json`, `fiat-ducato-l2h2.json`)
- **Variables**: camelCase (e.g., `selectedVehicle`, `cargoLength`)

### Data Structure Rules

#### Vehicle Data (`src/data/vehicles/`)
- Located in `src/data/vehicles/` folder
- Each vehicle is a separate JSON file
- Must be imported and exported in `src/data/vehicles/index.js`
- **Important**: Vehicle dimensions are accessed via `vehicle.cargo_box.length/width/height`

Example structure:
```json
{
  "id": "vehicle_id",
  "brand": "Brand Name",
  "model": "Model Name",
  "variant": "Variant",
  "cargo_box": {
    "length": 0000,
    "width": 0000,
    "height": 0000
  }
}
```

#### Cargo Data (`src/data/cargo/`)
- Located in `src/data/cargo/` folder
- Each cargo type is a separate JSON file
- Must be imported and exported in `src/data/cargo/index.js`
- **Important**: Cargo dimensions are accessed via `cargo.dimensions.length/width/height`

Example structure:
```json
{
  "id": "cargo_id",
  "name": "Cargo Name",
  "description": "Description",
  "dimensions": {
    "length": 0000,
    "width": 0000,
    "height": 0000
  }
}
```

## Import Guidelines
- Use CSS Modules: `import styles from './ComponentName.module.css'`
- Apply styles: `className={styles.className}`
- For multiple classes: `className={\`${styles.class1} ${styles.class2}\`}`
- When importing components from folders, specify the full path including the component file

## Code Style
- Use functional components with hooks
- Destructure props in function parameters
- Use `const` for immutable values, `let` only when necessary
- Use template literals for string concatenation
- Keep functions focused and single-purpose

## File Organization
- All components in `src/components/`
- All data in `src/data/`
- Group related functionality in folders
- Keep component files concise (split large components if needed)

## When Making Changes
1. Check existing file structure before creating new files
2. Update import paths when moving files
3. Verify all imports after structural changes
4. Maintain consistency with existing naming conventions
5. Keep CSS Modules separate from JSX files

## JSON Data Transfer
- Use JSON format for all data exchange between frontend and backend
- Keep data structure consistent across similar entities
- Use clear, descriptive property names
- Include all necessary metadata in JSON files
