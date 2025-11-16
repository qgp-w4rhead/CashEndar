### FEATURES

- [x] Instead of using the "Amount" field and refreshing it dynamically, make a new "Total Amount" field that will be in the "Last Purchase" section
- [x] Add a "Resupply" button (Depicted as "+1") that allows to add the current date to the "last-purchase-section" for this item
- [x] When clicking the + button and no days are selected, the default behaviour should be to open the modal to add a payment for the current day, we can do so by selecting the day in question instead of the first
- [x] Don't close the modal when the resupply button is clicked
- [X] The amount of Portions should be equal to the amount of estimated portions X [times] the amount of purchase in the last purchase/resupply section.
- [X] The amount of portions should go down by the depletion rate
- [x] An option to forego or skip the payment
- When using the forego payment button, it greys out the payment but the payment is still apparent, just greyed and not accounted for in the total
- [x] Display the payment.amount sum total for the day in question dead center, above the day number [calendar-dates]
- [x] Estimated Next Purchase doesn't refresh when a Resupply is added.
- [x] For inventory items, Estimate cost per year at current rate of purchase from last 3 purchase ALSO, from depletion rate vs purchase price (make a toggle that allows to switch between the 2 values)
- [x] A "Last Purchase" section under the "Inventory Details"

- [x] Allows to view the 3 last purchase
- [x] Estimate the next date of purchase by doing a average from the 3 last ones.

- [X] A filter function for the "Next Payment" section that allows sorting per category of "Payment Type".

- [X] A sort function in the "Next Payment" section that allows to sort payments by amount [Largest/lowest] or dates [Next/Latest]

- [X] When creating a new payment type using the "Add new payment type" [add-type-section] :
    - We need to be able to click a toggle to switch between "Payment" and "Earning"
    - Place the toggle on the same line as "form-group"

- [x] When we click on a item and said item pulsate : 
    - Every payment/item of the same type should pulsate not just the item on which the date was set.

- [ ] When deleting a category of payment
    - Give a warning with the amount of payments related to that category
    - Also give a warning about backing payments up through the "Export Payment" option.

________________

### BUGSECTION / DESIGNFLAWS

- [x] The "filter-btn" currently only affects the items in the "Next payments" section : 
    Instead, it should also affect the calendar to filter out the different categories 

- [ ] The slider bar that's behind the slider doesn't follow the slider accuratelly enough

- [X] Portions currently include all future purchase rather than current and past purchase
- [X] Future inventory purchase should add to previous portion count if its the same item name

- [x] By default, "Inventory Tracker" should select "Depletion Rate"

- [x] When clicking a inventory item in the Inventory tracker, every instance of the item should glow for any given day.

- [x] The inventory items are now hidden from the calendar despite the filter being switched off.

- [x] Inventory items are technically purchase so they should show up when toggling "purchase"

- [x] Put "char-count" on the same line as "Payment Type Name"

- [x] Instead of pulsating all the items of the same payment type, it should pulsate only for the same "payment-item"
- [ ] Inventory Items Chart is broken in a few key points.
    - Portion Count Line Indicator (Should be equivalent to getEstimatedPortions/depletionRate)
    - Portion Size Line Indicator (Should be equivalent to itemSize/portionSize)

- [ ] Currently, there is weird calculation being made when the depletionUnit is changed from day to other alternatives.
    - Amount should be the same in terms of depletionTime (no math), only the unit should change.

- [ ] Tumbler-icon doesn't work on Inventory Tracker (doesn't go 90 degree like the other ones)
- [ ] 