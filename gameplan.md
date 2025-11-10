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
- [ ] For inventory items, Estimate cost per year at current rate of purchase from last 3 purchase ALSO, from depletion rate vs purchase price (make a toggle that allows to switch between the 2 values)
- [x] A "Last Purchase" section under the "Inventory Details"

- [x] Allows to view the 3 last purchase
- [x] Estimate the next date of purchase by doing a average from the 3 last ones.

- [ ] A filter function for the "Next Payment" section that allows sorting per category of "Payment Type".

- [ ] A sort function in the "Next Payment" section that allows to sort payments by amount [Largest/lowest] or dates [Next/Latest]

________________

### BUGSECTION / DESIGNFLAWS

- [ ] The slider bar that's behind the slider doesn't follow the slider accuratelly enough

- [X] Portions currently include all future purchase rather than current and past purchase
- [X] Future inventory purchase should add to previous portion count if its the same item name

- [ ] By default, "Inventory Tracker" should select "Depletion Rate" for the toggle-container and grey out the "Purchase" option if the condition of 3 last purchase is not met

- [ ] when hovering the "Purchase: option and the condition is not met, the tool tip displays "insufficient data"