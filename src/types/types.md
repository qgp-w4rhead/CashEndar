# CashEndar Types Reference

This document describes every data type used in CashEndar, their fields, and how they map to MongoDB collections.

---

## Payment

**MongoDB collection:** `payments`

A Payment represents any financial transaction — expense, earning, or inventory purchase — tracked on the calendar. It supports multiple recurrence patterns and optional inventory-tracking fields.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique identifier. MongoDB `ObjectId` mapped to string via the API's `toJSON` transform. Used throughout the frontend to reference specific payments. |
| `title` | `string` | Yes | Display name of the payment (e.g. "Netflix", "Rent", "Chicken Breast"). |
| `amount` | `string` | Yes | Dollar amount stored as a `$`-prefixed string (e.g. `"$12.50"`). Parsed via `parseAmount()` for arithmetic. For inventory items with quantity > 1, this is the **total** (unitCost × quantity). |
| `date` | `string` | Yes | Human-readable date string (e.g. `"January 5, 2025"`). Parsed via `parsePaymentDate()`. For recurring payments, this is updated per-occurrence in computed views. |
| `time` | `string` | No | Optional time string associated with the payment. |
| `type` | `string` | Yes | References a `PaymentType.value` slug (e.g. `"rent"`, `"inventory"`, `"earnings"`). Determines how the payment is categorized, colored, and whether it counts as income. |
| `day` | `number` | No | Day of the month (1–31). Used by **monthly recurring** and **one-time** payments to place them on the calendar. Not set for weekly/bi-monthly. |
| `dayOfWeek` | `number` | No | Day of the week (0 = Sunday, 6 = Saturday). Used by **weekly** and **bi-monthly** payments to determine recurrence. |
| `referenceDate` | `number` | No | Timestamp (ms since epoch) of the first occurrence. Used with `dayOfWeek` to calculate recurring instances for weekly/bi-monthly payments by computing the day-difference modulo the interval. |
| `frequency` | `string` | Yes | Recurrence pattern. One of: `"one-time"` (single occurrence), `"recurring"` (monthly on `day`), `"weekly"` (every 7 days from `referenceDate`), `"bi-monthly"` (every 14 days from `referenceDate`). |

### Inventory-specific fields

These fields are only populated when `type === "inventory"`. They enable tracking of consumable goods, depletion rates, and expiration.

| Field | Type | Description |
|---|---|---|
| `itemName` | `string` | Canonical name of the inventory item (usually matches `title`). Used to group purchases of the same item across time for history and averages. |
| `brand` | `string` | Brand or manufacturer name. |
| `quantity` | `number` | Number of units purchased in this transaction (defaults to 1). |
| `unitCost` | `number` | Cost per single unit before quantity multiplication. |
| `itemSize` | `number` | Size/weight/volume of a single unit (e.g. `500` for 500g). |
| `itemSizeUnit` | `string` | Unit of measurement for `itemSize`. One of: `"single"`, `"gram"`, `"kg"`, `"ml"`, `"liter"`, `"cup"`, `"tablespoon"`, `"teaspoon"`, `"piece"`, `"can"`, `"bottle"`. |
| `portionSize` | `number` | Size of a single serving/portion drawn from the item. |
| `portionsCount` | `number` | Total number of portions available in the item. |
| `depletionRate` | `number` | How many portions are consumed per `depletionUnit` time period. |
| `depletionUnit` | `string` | Time unit for depletion rate. One of: `"day"`, `"week"`, `"month"`. |
| `depletionTime` | `number` | Computed total time (in days) until the item is fully depleted. |
| `forgone` | `boolean` | Whether this payment instance has been marked as skipped/forgone. |

### Expiration-tracking fields

Used to calculate when an inventory item expires, accounting for shelf life and optional freshness offset.

| Field | Type | Description |
|---|---|---|
| `expirationPeriod` | `number` | Shelf life duration value (e.g. `5`). |
| `expirationUnit` | `string` | Time unit for shelf life. One of: `"day"`, `"week"`, `"month"`, `"year"`. |
| `freshnessOffset` | `number` | Number of time units to subtract from the expiration period to determine a "use by" recommendation earlier than the true expiration. |
| `freshnessOffsetUnit` | `string` | Time unit for the freshness offset. One of: `"day"`, `"week"`, `"month"`, `"year"`. |
| `calculatedExpirationDate` | `string` | Computed expiration date in `YYYY-MM-DD` format. Calculated as: `purchase date + expirationPeriod − freshnessOffset`. |

---

## PaymentType

**MongoDB collection:** `paymenttypes`

A PaymentType defines a category that payments can belong to. Each type has a display label, a slug value, a color, and flags for whether it's custom or represents income.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique identifier. For default types, this is the slug itself (e.g. `"rent"`). For custom types, a timestamp-based string. Stored as `_id` in MongoDB. |
| `label` | `string` | Yes | Human-readable display name (e.g. `"Rent"`, `"Utility"`). |
| `value` | `string` | Yes | Lowercase slug used as the foreign key in `Payment.type` (e.g. `"rent"`, `"my_custom_type"`). Must be unique across all payment types. |
| `color` | `string` | Yes | Hex color code for UI display (e.g. `"#ef4444"`). |
| `isCustom` | `boolean` | Yes | `false` for the 6 built-in types, `true` for user-created types. Only custom types can be deleted. |
| `isEarning` | `boolean` | No | If `true`, payments of this type are treated as income rather than expenses. Defaults to `false`. |

### Default Payment Types

These are auto-seeded into MongoDB if the `paymenttypes` collection is empty:

| ID/Value | Label | Color | isEarning |
|---|---|---|---|
| `rent` | Rent | `#ef4444` (red) | No |
| `utility` | Utility | `#f59e0b` (amber) | No |
| `credit` | Credit | `#06b6d4` (cyan) | No |
| `subscription` | Subscription | `#10b981` (green) | No |
| `inventory` | Inventory | `#8b5cf6` (purple) | No |
| `earnings` | Earnings | `#10b981` (green) | Yes |

---

## Earning (Legacy)

**Not stored separately.** Defined in `payment.types.ts` but not actively used as a standalone entity. Earnings are simply `Payment` records whose `PaymentType.isEarning === true`.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier. |
| `title` | `string` | Display name. |
| `amount` | `string` | Dollar amount string. |
| `date` | `string` | Human-readable date. |
| `type` | `string` | Payment type slug. |
| `day` | `number` | Day of month. |
| `isRecurring` | `boolean` | Whether this earning repeats monthly. |

---

## Enums & Constants

### PaymentFrequency
Defines how often a payment recurs.

| Value | Label | Behavior |
|---|---|---|
| `"one-time"` | One-Time | Occurs once on the specified `date`. |
| `"weekly"` | Weekly | Repeats every 7 days from `referenceDate` on `dayOfWeek`. |
| `"bi-monthly"` | Bi-Monthly | Repeats every 14 days from `referenceDate` on `dayOfWeek`. |
| `"recurring"` | Monthly | Repeats on the same `day` of every month. |

### ViewMode
Controls calendar display granularity.

| Value | Description |
|---|---|
| `"month"` | Show full month grid. |
| `"week"` | Show single week strip. |

### SortMode
Controls how the "Next Payments" list is ordered.

| Value | Description |
|---|---|
| `"date-asc"` | Earliest date first. |
| `"date-desc"` | Latest date first. |
| `"amount-asc"` | Lowest amount first. |
| `"amount-desc"` | Highest amount first. |
