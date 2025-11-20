# CashEndar

*A modern Vue.js application for personal finance management that combines payment tracking with inventory management on an interactive calendar interface.*

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/qgp-w4rhead/CashEndar)
[![Vue](https://img.shields.io/badge/Vue-3.5.22-green.svg)](https://vuejs.org/)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

- The point of this application is to track your expenses and divide it into category in a way that allows to estimate and reduce your usage to the correct level, saving yourself money in the process.

  

Canada produce more waste per person than ANY OTHER COUNTRY ON EARTH

**That is more than 2KG per person / day**

- Ontario and Quebec being the biggest culprits

Upcycling and Recycling can be efficient means to reduce waste but the problem is that you can never get back the time and effort you put into it : 

**- This makes reduction of purchase the most effective mean of waste management.**

In short, *Cashendar* helps you estimate and manage your future, pre-calculated habits from your past purchases to prepare your spendings from your earnings.

- Can help "Sync" your purchase to rebates
- Allows to track bulk purchase effectively reducing waste
- Can prevent you from going into a busy week without any food, resulting in "Uber", "Skip", fast food or restaurent cost. 

## Features

### Payment Management
- **Interactive Calendar View**: Visual calendar displaying all payments and earnings with color-coded categories
- **Flexible Payment Types**: Create custom payment categories (credit, utilities, subscriptions, etc.) with custom colors
- **Frequency Options**: Support for one-time, weekly, bi-monthly, and monthly recurring payments
- **Earnings vs Expenses**: Separate tracking for income streams and outgoing payments
- **Forgone Payments**: Mark payments as skipped/foregone without losing track of them

### Inventory Tracking
- **Smart Inventory Management**: Track household items with automatic depletion estimation
- **Portion Tracking**: Monitor consumption rates and remaining portions with visual indicators
- **Cost Analysis**: Calculate annual costs based on purchase history or depletion rates
- **Automatic Resupply**: Track purchase dates and estimate next needed purchases
- **Visual Comparisons**: Compare inventory items with bar charts and detailed metrics

### Analytics & Insights
- **Interactive Charts**: Pie chart summaries of payments by category and expense breakdowns
- **Financial Overviews**: Monthly summaries, upcoming payments, and remaining balance calculations
- **Inventory Analytics**: Compare multiple inventory items with detailed statistics
- **Depletion Projections**: Estimate when items will need to be repurchased

### Advanced Tools
- **Smart Filtering**: Filter payments by type, view earnings or expenses only
- **Multi-sort Options**: Sort by date (earliest/latest) or amount (lowest/highest)
- **Import/Export**: Backup and restore your financial data
- **Settings Management**: Customize payment types, reset views, and clear data
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Installation & Setup

### Prerequisites
- Node.js (^20.19.0 || >=22.12.0)
- npm, yarn, or pnpm package manager

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/qgp-w4rhead/CashEndar.git
cd CashEndar
```

2. **Install dependencies**
```bash
pnpm install
# or
npm install
# or
yarn install
```

3. **Start development server**
```bash
pnpm dev
# or
npm run dev
# or
yarn dev
```

4. **Open in browser**
Navigate to `http://localhost:5173` (or the port shown in terminal)

### Build for Production
```bash
pnpm build
# or
npm run build
```

## Usage Guide

### Getting Started
1. **Add Your First Payment**: Click the "+" button or click on a calendar date to open the payment modal
2. **Choose Payment Type**: Select from default types or create custom ones with the "+" icon
3. **Set Details**: Enter amount, date, and frequency for recurring payments

### Payment Management
- **Adding Payments**: Click any calendar date or use the main "+" button
- **Editing**: Click the "⋯" menu on any payment in the sidebar or calendar
- **Payment Types**: Access settings (gear) -> "Manage Payment Types" to customize categories
- **Filtering**: Use the filter button (funnel) to show specific payment types or switch between payments/earnings

### Inventory Tracking
1. **Add Inventory**: Click the purple "+" in the "Inventory Tracker" section
2. **Setup Process**: Follow the 4-step wizard:
   - Enter product name and cost
   - Set item size and portion details
   - Configure depletion tracking
   - Add initial purchase date

3. **Track Usage**: Click "Resupply" (+1) when you buy more items
4. **Monitor Depletion**: View remaining portions, estimated depletion dates, and cost projections

### Analytics & Charts
- **Payment Summary**: Click the chart icon (arrow-circle) next to month navigation
- **Inventory Comparison**: Click the item chart icon for detailed inventory analytics
- **Summaries**: Expand collapsible sections for upcoming payments and earnings overviews

### Data Management
- **Export**: Settings -> Export Payments to download your data
- **Import**: Settings -> Import Payments to restore from backup
- **Clear Data**: Settings -> Clear All Payments (irreversible)

## Tech Stack

- **Frontend**: Vue 3 (Composition API)
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: CSS with scoped components
- **State Management**: Vue reactive refs and composables
- **Data Persistence**: Local storage via custom services (IndexedDB)

## Upcoming Features

- Graph usage over time
- Current item price in favorite store
- Expiration date (Drops "totalCount" to 0 once reached)

## Support Development

If you find CashEndar helpful for managing your finances, consider supporting continued development :

### GitHub Support
- **Star** the repository to show your appreciation ⭐ 
- **Watch** for updates and new features
- **Report Issues** for bugs or feature requests

### Financial Support
<a href="https://www.buymeacoffee.com/qgp.w4rhead" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" >
</a>

## Project Structure

- The structure of the project looks like this : 

```
CashEndar/
├── src/
│   ├── components/           # Vue components
│   │   ├── PaymentCalendar.vue     # Main calendar component
│   │   ├── primatives/             # Reusable UI components
│   │   └── inventory-fields-stepper.vue
│   ├── composables/          # Vue composables for logic
│   ├── services/             # Data management services
│   ├── stores/               # Reactive state stores
│   ├── types/                # TypeScript type definitions
│   └── main.ts               # App entry point
├── public/                   # Static assets
└── package.json              # Dependencies and scripts
```

## Security / Disclaimer

- The software comes with no warranty.
- The software uses IndexedDB, a Database that is stored in the cache of your browser, as such : 
  - The security of the application (Cashendar) depends on your browser security

## gameplan.md

- The gameplan section tracks features and bugs being worked on at the moment, like a ultra-simplified Jira (shudders).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

I built this project with modern web technologies to make day-to-day personal finance tracking intuitive and comprehensive. 

Special thanks to the Vue.js and Cline community for excellent documentation and tools. 🙏 (Thank you guys seriously.)