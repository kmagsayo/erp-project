# ResponsivCode ERP (RTS ERP System)

Modern ERP frontend for ResponsivCode — quotation-to-accomplishment workflow with a professional maroon + white design system.

## Workflow

`Quotation → Purchase Order → Receiving → Inventory → Outslip → Delivery Receipt → Billing → SOA → Accomplishment Report`

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- React Router
- Lucide React (icons)

## Getting Started

### Prerequisites

- Node.js 18+ (Node 20+ recommended)
- npm

### Clone & install

```bash
git clone https://github.com/ElgieYtang/RTS_ERP_System.git
cd RTS_ERP_System
npm install
```

### Run locally

```bash
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

### Build for production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
  components/
    layout/     # Sidebar, Header, AppLayout, PageHeader
    ui/         # Button, Badge, Card, Table, Input
    workflow/   # WorkflowTracker
  config/
    navigation.ts
  pages/        # Dashboard, Quotations, module placeholders
  lib/
    theme.ts    # Color tokens
    utils.ts
```

## Design System

| Token | Color | Usage |
|-------|-------|-------|
| Primary Maroon | `#8B1E3F` | Sidebar, primary buttons, active accents |
| Dark Maroon | `#6F1832` | Hover states |
| Light Maroon | `#F8E9EE` | Active nav, row hover, workflow accents |
| Page Background | `#F7F7F8` | Main content area |
| Surface | `#FFFFFF` | Cards, tables, forms |
| Text Primary | `#252525` | Titles, body text |
| Text Secondary | `#6B7280` | Descriptions, metadata |

## Team Notes

- `node_modules` and `dist` are not committed — run `npm install` after cloning.
- Use feature branches for new modules; keep `main` stable for the team.
