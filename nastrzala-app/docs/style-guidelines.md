# Style Guidelines

## Color Palette

### Primary Colors
- **Green (Primary Action)**: `#4CAF50` (hover: `#45a049`)
- **Blue (Accents)**: `#4299e1` (hover: `#3182ce`)

### Neutral Colors
- **Dark Text**: `#1a202c`, `#2d3748`
- **Medium Text**: `#4a5568`, `#718096`
- **Light Backgrounds**: `#f7fafc`, `#f5f5f5`
- **Borders**: `#e2e8f0`, `#cbd5e0`

### Status Colors
- **Success**: `#48bb78` (bg: `#c6f6d5`, text: `#22543d`)
- **Error**: `#f56565` (bg: `#fed7d7`, text: `#742a2a`)

### Gradients
- **Page Background**: `linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)`

## Typography

### Font Sizes
- **Page Title**: `2.5rem` (mobile: `2rem`)
- **Section Titles**: `1.5rem`
- **Subtitles**: `1.25rem` - `1.1rem`
- **Body Text**: `1rem` - `0.95rem`
- **Small Text**: `0.85rem` - `0.9rem`

### Font Weights
- **Bold**: `700`
- **Semi-bold**: `600`
- **Medium**: `500`
- **Regular**: `400`

### Line Heights
- **Headings**: `1.2` - `1.4`
- **Body Text**: `1.6` - `1.8`

## Spacing

### Padding
- **Large Sections**: `1.5rem` - `2rem`
- **Cards/Components**: `1rem` - `1.5rem`
- **Small Elements**: `0.75rem` - `1rem`

### Gaps
- **Large**: `1.5rem` - `2rem`
- **Medium**: `1rem` - `1.5rem`
- **Small**: `0.5rem` - `0.75rem`

### Margins
- **Section Spacing**: `1rem` - `2rem`
- **Element Spacing**: `0.5rem` - `1rem`

## Components

### Buttons
```css
padding: 1rem 1.5rem;
border-radius: 8px;
font-size: 1rem;
font-weight: 600;
transition: all 0.3s ease;
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
```

**Hover State:**
```css
transform: translateY(-2px);
box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
```

**Active State:**
```css
transform: translateY(0);
```

### Input Fields & Selects
```css
padding: 1rem 1.25rem;
border: 2px solid #e2e8f0;
border-radius: 8px;
font-size: 1rem;
transition: all 0.2s ease;
```

**Hover State:**
```css
border-color: #cbd5e0;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
```

**Focus State:**
```css
border-color: #4299e1;
box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
outline: none;
```

### Cards/Sections
```css
background: white;
padding: 1.5rem;
border-radius: 12px;
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
```

### Lists
```css
padding: 0.75rem 1rem;
background: #f7fafc;
border-radius: 8px;
border-left: 4px solid [color];
```

**Border Colors:**
- Blue (dimensions): `#4299e1`
- Green (cargo): `#48bb78`

## Layout

### Max Widths
- **Main Content**: `1000px`
- **Dialog**: `1100px`

### Breakpoints
- **Mobile**: `max-width: 768px`
- **Tablet**: `769px - 968px`
- **Desktop**: `> 968px`

### Grid Layouts
**Dialog Content:**
```css
grid-template-columns: 2fr 1fr;
gap: 1.5rem;
```

## Animations

### Transitions
- **Standard**: `all 0.2s ease`
- **Button Effects**: `all 0.3s ease`

### Keyframes

**Fade In:**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**Slide Up:**
```css
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

## Icons

### Size
- **Standard**: `20px × 20px`
- **Large**: `24px × 24px`

### Colors
- **Default**: `#718096`
- **Hover**: `#2d3748`
- **Delete/Remove**: `#e53e3e` (hover: `#c53030`)

## Accessibility

### Focus States
Always include visible focus states with:
- Border color change
- Box shadow: `0 0 0 3px rgba(color, 0.1)`
- No default outline

### Button States
- Default
- Hover (transform, shadow)
- Active (reduced transform)
- Disabled (reduced opacity, no pointer)

### Color Contrast
Maintain WCAG AA standards:
- Text on white: minimum `#4a5568`
- Important text: `#2d3748` or darker

## Best Practices

1. **Consistency**: Use the same spacing, colors, and typography throughout
2. **Responsive**: Design mobile-first, enhance for larger screens
3. **Performance**: Use CSS transitions, not JavaScript animations
4. **Accessibility**: Always include focus states and proper contrast
5. **Maintainability**: Use CSS modules with clear class names
6. **Visual Hierarchy**: Use size, weight, and color to establish importance
7. **White Space**: Don't overcrowd - let content breathe
8. **Shadows**: Use subtle shadows for depth, increase on interaction
