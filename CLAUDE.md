# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Eltern-Kompass is a German parental allowance (Elterngeld) optimizer application with:
- **Frontend**: Next.js 15 app in `eltern-kompass/`
- **Backend**: Xano using XanoScript (tables, functions, APIs in root directories)

## Commands

### Frontend (eltern-kompass/)
```bash
cd eltern-kompass
npm run dev      # Development server (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

### Backend (Xano)
Push changes using `push_all_changes_to_xano` MCP tool.

## Frontend Architecture

### App Router Structure
- `/` - Landing page
- `/quick-check` - 5-step wizard for quick estimate
- `/ergebnis` - Results page with CTA
- `/registrieren` - User registration
- `/portal/onboarding` - 4-step detailed onboarding
- `/portal/ergebnis` - Paywall with calculation results
- `/portal/strategie` - Premium dashboard (post-payment)

### Key Patterns
- **State persistence**: `useQuickCheck` and `useOnboarding` hooks use localStorage
- **Auth**: Currently mock-based via `eltern-kompass-auth` localStorage key
- **UI Components**: shadcn/ui with Radix primitives in `components/ui/`
- **Calculations**: `lib/calculations/` contains BEEG formula implementations

### User Flow
```
Landing → Quick-Check → Ergebnis → Registrieren → Portal/Onboarding → Portal/Ergebnis (Paywall) → Portal/Strategie
```

### Component Organization
- `components/ui/` - Base shadcn/ui components
- `components/landing/` - Marketing page sections
- `components/quick-check/` - Quick estimate wizard
- `components/portal/` - Authenticated user components

## XanoScript Development

### Before Writing XanoScript
**Always read the relevant documentation first** before writing or modifying XanoScript:
- Read `xano-docs/docs/` guides for the specific feature you're implementing
- Check `xano-docs/docs/tips_and_tricks.md` for common patterns

### Learning & Error Handling
When you learn something new about XanoScript or fix an error, **use the `/xano-learning` skill** to document the insight in CLAUDE.md. This helps future sessions avoid the same mistakes.

### Directory Structure
- `tables/` - Database table definitions
- `functions/` - Reusable business logic functions
- `apis/` - API endpoint definitions
- `tasks/` - Scheduled background tasks

### Development Workflow
1. Create tables first (without cross-references initially)
2. Add relationships after all tables exist
3. Create functions for business logic
4. Define API endpoints
5. Push changes using `push_all_changes_to_xano` tool

### XanoScript Syntax
- Comments: `//` on own line, outside statements
- No variable scope - variables accessible everywhere
- Use `params` (not `body`) for external API request bodies
- Environment variables: `$env.<variable_name>`
- Filters: `$value|filter_name:arg1:arg2`

### Key Documentation
- `xano-docs/docs/table_guideline.md`
- `xano-docs/docs/function_guideline.md`
- `xano-docs/docs/api_query_guideline.md`
- `xano-docs/docs/expression_guideline.md`

## Domain Context (BEEG)

German parental allowance regulations:
- Elterngeld calculated individually per parent
- Income threshold: 175,000 EUR combined for couples
- Tax class optimization: Must be held 7+ months in assessment period
- Assessment period: 12 months before maternity leave (mother) vs. before birth (partner)
- Legal reference: `BEEG Gesetz/beeg_gesetz.html`
- Calculation formulas: `BEEG Gesetz/beeg-berechnungsformeln.md`
