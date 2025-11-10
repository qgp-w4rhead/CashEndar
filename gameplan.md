Estimated Cost per year

A "Last Purchase" section under the "Inventory Details"
- Allows to view the 3 last purchase
- Estimate the next date of purchase by doing a average from the 3 last ones.

## Example

6th, 12th, 18th were last purchase made for butter

the next one would be : 24th

- [x] Instead of using the "Amount" field and refreshing it dynamically, make a new "Total Amount" field that will be in the "Last Purchase" section

- [x] Add a "Resupply" button (Depicted as "+1") that allows to add the current date to the "last-purchase-section" for this item

- [x] When clicking the + button and no days are selected, the default behaviour should be to open the modal to add a payment for the current day, we can do so by selecting the day in question instead of the first

- [x] Don't close the modal when the resupply button is clicked

- [X] The amount of Portions should be equal to the amount of estimated portions X [times] the amount of purchase in the last purchase/resupply section.

- [X] The amount of portions should go down by the depletion rate

- [ ] An option to forego or skip the payment
- When using the forego payment button, it greys out the payment but the payment is still apparent, just greyed and not accounted for in the total

- [x] Display the payment.amount sum total for the day in question dead center, above the day number [calendar-dates]
- [x] Estimated Next Purchase doesn't refresh when a Resupply is added.

________________

### BUGSECTION

- The slider bar that's behind the slider doesn't follow the slider accuratelly enough

- Portions currently include all future purchase rather than current and past purchase
- Future inventory purchase should add to previous portion count if its the same item name