# Migrating Stash Sage to Radix UI - Accessible Component Library

## Context
- **Project**: Stash Sage (Cannabis tracking PWA)
- **Current Stack**: React 18 + Vite + TypeScript + Tailwind CSS + Supabase
- **Current State**: 40+ components, inline Tailwind styles, no design system, custom components
- **Target**: Radix UI primitives with Radix Colors + full WCAG 2.1 AA accessibility
- **Build System**: Vite + React 18 + TypeScript + Tailwind CSS

---

## Migration Strategy Overview

### Phase 1: Foundation (Week 1)
- [ ] Install Radix UI primitives and dependencies
- [ ] Set up Radix Themes provider with custom color palette
- [ ] Configure CSS variables for theming
- [ ] Remove Tailwind CSS dependency (or keep as utility only)

### Phase 2: Primitive Components (Atoms) - Week 1-2
- [ ] Button variants with loading/disabled states
- [ ] Input/Textarea with validation states
- [ ] Icon system (use lucide-react as-is)
- [ ] Avatar, Badge, Badge, Spinner primitives
- [ ] Tooltip, Popover, Dialog primitives

### Phase 3: Composite Components (Molecules/Organisms) - Week 2-3
- [ ] Button, Input, Textarea, Select, Combobox
- [ ] Form components with validation
- [ ] Modal, Dialog, Drawer, Toast
- [ ] Tabs, Accordion, Menu, Select, Combobox
- [ ] Data display: Table, Card, List, Avatar, Badge

### Phase 4: Feature Components Migration - Week 3-4
- [ ] PostCard → decomposed into PostHeader, PostContent, PostActions
- [ ] MarketplaceCard → ListingImage, ListingInfo, SellerCard
- [ ] PostDetailView → composed from primitives
- [ ] SettingsSheet → decomposed into sections
- [ ] ProductModal, ProductView, MarketplaceCard

### Phase 5: Layout & Navigation - Week 4
- [ ] Sidebar with collapsible sections
- [ ] Header with search, user menu
- [ ] BottomNav for mobile
- [ ] MobileSheet for bottom sheets

### Phase 6: Accessibility & Polish - Week 5
- [ ] WCAG 2.1 AA compliance audit
- [ ] Focus management, keyboard navigation
- [ ] Screen reader testing
- [ ] Color contrast validation
- [ ] Focus trap in modals/drawers

---

## Dependencies to Install

### Core Radix UI
```bash
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-dropdown-menu
npm install @radix-ui/react-dropdown-menu @radix-ui/react-hover-card @radix-ui/react-popover
npm install @radix-ui/react-select @radix-ui/react-slot @radix-ui/react-tooltip
npm install @radix-ui/react-accordion @radix-ui/react-accordion
npm install @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-label
npm install @radix-ui/react-menubar @radix-ui/react-navigation-menu
npm install @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-radio-group
npm install @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator
npm install @radix-ui/react-slider @radix-ui/react-switch @radix-ui/react-tabs
npm install @radix-ui/react-toggle @radix-ui/react-toggle-group
npm install @radix-ui/react-toast @radix-ui/react-visually-hidden
```

### Theming & Color
```bash
npm install @radix-ui/colors @radix-ui/themes
```

### Icons (keep lucide-react)
```bash
# Already have: lucide-react
```

### Form Handling
```bash
npm install @hookform/resolvers zod @hookform/resolvers
```

### Accessibility Testing
```bash
npm install -D @axe-core/react axe-core jest-axe @testing-library/react @testing-library/user-event
```

### Form Handling (Mantine or React Hook Form)
```bash
npm install @mantine/form @mantine/hooks
# OR
npm install react-hook-form @hookform/resolvers zod
```

### Remove Tailwind (optional - keep for utilities only)
```bash
# npm uninstall tailwindcss postcss autoprefixer
# Keep postcss for autoprefixer only
```

---

## Implementation Plan - Detailed Tasks

### TASK-1: Setup Radix Themes Provider
- [ ] Install @radix-ui/themes
- [ ] Create ThemeProvider wrapper
- [ ] Configure custom color palette (cyn/emerald theme)
- [ ] Set up CSS variables for theming
- [ ] Configure dark/light mode toggle

### TASK-2: Replace Button Component
- [ ] Create Button component using Radix UI Slot + styling
- [ ] Variants: primary, secondary, ghost, destructive, outline, link
- [ ] Sizes: sm, md, lg, icon
- [ ] States: loading, disabled, focus-visible
- [ ] Add asChild polymorphic support

### TASK-3: Form Components
- [ ] Input with label, error, helper text
- [ ] Textarea with auto-resize
- [ ] Select/Combobox with search
- [ ] Checkbox, Radio, Switch components
- [ ] DatePicker, DateRangePicker
- [ ] FileInput with drag-drop

### TASK-4: Dialog/Modal System
- [ ] Base Modal with focus trap
- [ ] AlertDialog, ConfirmDialog
- [ ] Drawer (mobile bottom sheet)
- [ ] Toast/Notification system
- [ ] Tooltip, Popover, HoverCard

### TASK-5: Navigation Components
- [ ] Sidebar with collapsible sections
- [ ] Tabs, TabsList, TabTrigger, TabContent
- [ ] Breadcrumbs, Pagination
- [ ] Breadcrumb, NavLink

### TASK-5: Form Components
- [ ] Form, Field, useField hook
- [ ] Validation with Zod schema
- [ ] Error messages, helper text
- [ ] FieldArray for dynamic fields

### TASK-6: Data Display
- [ ] Table with sorting, pagination
- [ ] Card, CardHeader, CardContent, CardFooter
- [ ] Avatar with fallback initials
- [ ] Badge, Tag, Chip
- [ ] Table, DataTable with sorting/filtering

### TASK-7: PostCard Decomposition
- [ ] PostHeader (avatar, author, timestamp, menu)
- [ ] PostContent (text, hashtags, mentions)
- [ ] PostMedia (image carousel)
- [ ] PostActions (like, comment, share, bookmark)
- [ ] PostFooter (comments, comment input)
- [ ] QuotedPost component
- [ ] CommentSection with threading

### TASK-8: Marketplace Components
- [ ] ListingCard (image, title, price, category)
- [ ] ListingDetail (full-screen mobile, split desktop)
- [ ] SellerCard with contact methods
- [ ] CategoryFilter chips
- [ ] Sort/Filter controls

### TASK-9: Settings & Profile
- [ ] SettingsSheet with tabs
- [ ] ProfileEditor (avatar, bio, contacts)
- [ ] Preferences (theme, notifications, feed)
- [ ] Security (PIN, password, email)
- [ ] Data export/import

### TASK-10: Accessibility Audit
- [ ] Run axe-core on all pages
- [ ] Fix color contrast issues
- [ ] Add focus-visible styles
- [ ] Implement skip links
- [ ] Add ARIA labels/descriptions
- [ ] Test with NVDA/VoiceOver
- [ ] Keyboard navigation for all interactive elements
- [ ] Focus trap in modals/drawers
- [ ] Skip links for main content

---

## Component API Design Standards

### Button
```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  asChild?: boolean;
}
```

### Input
```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

### Modal
```tsx
interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  forceMount?: boolean;
}
```

### Select
```tsx
interface SelectProps<T> {
  value: T | T[];
  onValueChange: (value: T | T[]) => void;
  options: { value: T; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
}
```

---

## Radix Themes Configuration

### Theme Configuration
```tsx
// theme.ts
import { createTheme } from '@radix-ui/themes';

export const theme = createTheme({
  colors: {
    cyan: {
      1: '#f0fdff',
      2: '#cffafe',
      3: '#a5f3fc',
      4: '#67e8f9',
      4: '#22d3ee',
      5: '#06b6d4',
      6: '#0891b2',
      7: '#0e7490',
      8: '#155e75',
      9: '#164e63',
      10: '#083344',
      11: '#062633',
      12: '#041b24',
    },
    emerald: {
      // ... similar scale
    },
    // ... rest of colors
  },
  radius: {
    1: '2px',
    2: '4px',
    3: '6px',
    4: '8px',
    5: '12px',
    5: '16px',
    6: '24px',
  },
  radius: '4px',
  spacing: 4,
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
});
```

### App Wrapper
```tsx
// App.tsx
import { Theme } from '@radix-ui/themes';
import { theme } from './theme';

function App() {
  return (
    <Theme theme={theme}>
      <AppContent />
    </Theme>
  );
}
```

---

## Migration Priority Order

### Week 1: Foundation & Primitives
1. Install Radix UI + dependencies
2. ThemeProvider setup
3. Button, Icon, Input, Textarea, Avatar, Badge
2. Tooltip, Popover, Dialog primitives

### Week 2: Form & Feedback
1. Form components with validation
2. Modal, Dialog, Toast, Tooltip
2. Select, Combobox, Checkbox, Radio, Switch

### Week 3: Feature Components
1. PostCard decomposition
2. MarketplaceCard decomposition
2. PostDetailView
2. ProductModal/ProductView

### Week 4: Navigation & Layout
1. Sidebar with collapsible sections
2. Header with search/user menu
2. BottomNav mobile
2. MobileSheet

### Week 5: Accessibility & Polish
1. Full a11y audit
2. Focus management
3. Keyboard navigation
3. Screen reader testing

---

## Commands

```bash
# Install all dependencies
npm install @radix-ui/themes @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-hover-card @radix-ui/react-popover @radix-ui/react-select @radix-ui/react-slot @radix-ui/react-tooltip @radix-ui/react-accordion @radix-ui/react-accordion @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-label @radix-ui/react-menubar @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toggle @radix-ui/react-toggle-group @radix-ui/react-toast @radix-ui/react-visually-hidden @radix-ui/colors @radix-ui/themes @radix-ui/react-accordion @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-label @radix-ui/react-menubar @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toggle @radix-ui/react-toggle-group @radix-ui/react-toast @radix-ui/react-visually-hidden

npm install @radix-ui/colors @radix-ui/themes

# Form handling
npm install @hookform/resolvers zod react-hook-form

# Testing
npm install -D vitest @testing-library/react @testing-library/user-event jsdom @vitest/coverage-v8 jest-axe @axe-core/react

# Remove Tailwind (optional)
# npm uninstall tailwindcss postcss autoprefixer
```

---

## Acceptance Criteria

- [ ] All components use Radix UI primitives
- [ ] Zero hardcoded colors/spacing (use design tokens)
- [ ] WCAG 2.1 AA compliant
- [ ] Full keyboard navigation
- [ ] Screen reader compatible
- [ ] Dark/light theme switching
- [ ] Build passes with no TypeScript errors
- [ ] Bundle size < 100KB gzipped
- [ ] All components have Storybook stories
- [ ] 80%+ test coverage
- [ ] Accessibility tests pass (jest-axe)

---

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking changes in Radix v1.x | Pin versions, test thoroughly |
| Bundle size increase | Tree-shake, lazy load heavy components |
| Theme migration complexity | Incremental migration, feature flags |
| Team learning curve | Internal docs, Storybook examples |

---

## Next Steps

1. **Immediate**: Install Radix UI dependencies
2. **Day 1-2**: ThemeProvider + Button + Icon + Input
3. **Day 3-4**: Form components + Modal + Toast
3. **Day 5-7**: Feature component migration
4. **Week 2**: Complete feature migration
4. **Week 3**: Accessibility audit + testing

---

*Generated: 2024-12-19*
*Project: Stash Sage - Radix UI Migration*
*Status: Planning Phase*