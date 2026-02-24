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

- [x] When deleting a category of payment
    - Give a warning with the amount of payments related to that category
    - Also give a warning about backing payments up through the "Export Payment" option.

- [x] Add "Portions" to Unit (some items are 1 of 1)

- [X] Add the field "brand" that only shows when selecting "Inventory" and make it (optional).

- [X] Modify "inventory-fields-section" to be a 4-step setup that helps to fast track users toward their objective.
    - Name of product, cost in first step (with a space for brand, mark it [optional] just like depletion rate)
    - Item Size and unit

- [X] Swap the inventory option from the "Add New / Edit Payment" to the Inventory Tracker (inventory-header)

- [X] We need to reuse the "add-btn" styling in purple to place in the top of the "inventory-section"

- [x] remove Portion Size Comparison

- [x] remove Portion Count Comparison

- [x] Graph usage over time
- [ ] Current item price in favorite store
- [o] Expiration date can be set for inventory item ("totalCount" should drop to 0 once reached)

- [ ] Mobile mode! Allows to use the app on restricted width device use media queries

### BUGSECTION / DESIGNFLAWS

- [x] The "filter-btn" currently only affects the items in the "Next payments" section : 
    Instead, it should also affect the calendar to filter out the different categories 

- [X] Portions currently include all future purchase rather than current and past purchase
- [X] Future inventory purchase should add to previous portion count if its the same item name

- [x] By default, "Inventory Tracker" should select "Depletion Rate"

- [x] When clicking a inventory item in the Inventory tracker, every instance of the item should glow for any given day.

- [x] The inventory items are now hidden from the calendar despite the filter being switched off.

- [x] Inventory items are technically purchase so they should show up when toggling "purchase"

- [x] Put "char-count" on the same line as "Payment Type Name"

- [x] Instead of pulsating all the items of the same payment type, it should pulsate only for the same "payment-item"
- [x] Inventory Items Chart is broken in a few key points.
    - Portion Count Line Indicator (Should be equivalent to getEstimatedPortions/depletionRate)
    - Portion Size Line Indicator (Should be equivalent to itemSize/portionSize)

- [x] Currently, there is weird calculation being made when the "depletionUnit" is changed from day to other alternatives.
    - Amount should be the same in terms of depletionTime (no math), only the unit should change.

- [x] Tumbler-icon doesn't work on Inventory Tracker (doesn't go 90 degree like the other ones)
- [X] Resupply button doesn't resupply anymore

- [X] Instead of using addForm.itemSizeUnit & addForm.portionUnit : 

- We can join them together, using the collection of units from portionUnit which is more extensive and using the name "itemSizeUnit" which is more descriptive (better code)

- We can then display the unit selected in "addForm.itemSizeUnit" instead of having 2 unit selection field. Similar to the following example : <span class="unit-display">{{ addForm.depletionUnit }}s</span>

- [x] Limit "portions-left" to .00 (2 position behind the dot)

- [x] The default option selected for : "editForm.depletionUnit" when opening the "Edit Payment" modal should be the same as the payment we are currently editing.

- [x] Portion size should be 1/2 because you eat 1 every day and there is 2 count in a pack :
    - Represent the portion size as a fraction instead
    - The fraction should be "DepletionRate/DepletionTime"

- [x] Estimated Portions : "getEstimatedPortions" should be able to count below 0 when it needs to display decimal

- [x] The bar fill should display the fraction instead of a full bar
    - Display the fraction on the bar-fill, filling only a portion of the bar relative to the fraction in decimal.

- [x] When the unit for portion size is higher than 1, make the bar-fill overdraw on top of itself with a second class (bar-fill-overdraw) that draws over the bar-fill with orange to indicate that the Portion Count is multiple time the amount of 1 
    - Example : The portionSize is 4 but the itemSize is 2, meaning the portionSize bar-fill display will display 2 (4/2)
    - That means, the bar-fill should be completelly overdrawed with bar-fill-overdraw
    - overdraw should use the following math to calculate how much it should fill : 

(portionSize-itemSize) / itemSize = overdraw

- [x] The "depletionDate" should be calculated at all time and never say "Forever"

- [x] The count must be in decimal

- [X] Additionally the count must represent portion-left / totalPortions :
    1. Display the division in count `table-cell portions-count` (bar-fill).
    2. Display a fraction like in `portion-size` for `cell-value`.
    3. Instead of a pure fraction, it shows ("portion remaining" / "bought total")


- [X] Instead of Edit Payment Amount being the total amount spent for a particular item, the amount value that is contained within the field {addPaymentAmount} should be autopopulated with : 
    - The average of all purchase price for an item
    - It should pre-fill as the answer for field : editForm.amount

- [x] Performance issue with Settings menu second layer.

____nitpicks

- Add a $ sign next to cost (1st and 3rd step)
- The entire button needs to be clickable, not just game-select (game-selector)
- modals should close when we click out or in another button that opens a modal.



__________________________

## COMMIT TERMINOLOGY : 

MODIFIED : Previous feature/style or file change that result in noticeable changes
ADDED : New Features that are worth mentionning to the user and develloper alike
FIXED : Bugfixes affecting specific area of the codebase.
REFACTORED : Refactoring of code, must include the name and short description of what was refactored.
REMOVED : idem

**In effect since 11/18/2025, anything after this date that doesn't match the above spec is considered a mistake and should be reported, the specification will evolve over time.**