## ADDED Requirements

### Requirement: Swiping left reveals a delete icon in Altglass
On the cellar page for the Altglass cellar, swiping a product row to the left SHALL reveal a delete icon at the right edge of that row. A short horizontal movement below a threshold SHALL snap back without revealing the icon. A mostly vertical movement SHALL scroll the list and SHALL NOT move the row. At most one row SHALL be open at a time.

#### Scenario: Reveal the delete icon
- **WHEN** the user swipes a row in the Altglass cellar to the left beyond the threshold
- **THEN** the row stays shifted left and a delete icon is visible at its right edge

#### Scenario: Short swipe snaps back
- **WHEN** the user moves a row only slightly to the left and releases it
- **THEN** the row returns to its normal position and no delete icon is shown

#### Scenario: Vertical scrolling is not captured
- **WHEN** the user drags mostly vertically across the rows
- **THEN** the list scrolls and no row moves sideways

#### Scenario: Only one open row
- **WHEN** a row is open and the user swipes another row open
- **THEN** the first row closes

### Requirement: An open row can be closed without deleting
An open row SHALL close, without deleting anything, when the user swipes it back to the right or taps outside its delete icon.

#### Scenario: Swipe back
- **WHEN** a row is open and the user swipes it to the right
- **THEN** the row closes and all its bottles remain

#### Scenario: Tap elsewhere
- **WHEN** a row is open and the user taps somewhere other than its delete icon
- **THEN** the row closes and all its bottles remain

### Requirement: Tapping the delete icon deletes all of the product's Altglass bottles
Tapping the revealed delete icon SHALL immediately delete, without a confirmation dialog, every bottle of that row's product in the Altglass cellar. The deletion SHALL be persisted and SHALL be synchronized to the Pod. Afterwards the row SHALL disappear, and the header count SHALL decrease by the number of deleted bottles. Ratings stored on the deleted bottles SHALL be deleted with them. The product resource and its legacy ratings SHALL be kept.

#### Scenario: Delete a row with three bottles
- **WHEN** the row of a product shows 3 bottles in Altglass and the user taps its delete icon
- **THEN** the 3 bottles are deleted, the row is no longer listed, and the header count is 3 lower

#### Scenario: Deletion survives a reload
- **WHEN** a product's Altglass bottles have been deleted and the page is reloaded
- **THEN** the product's row is still not listed in Altglass

#### Scenario: Bottles elsewhere are untouched
- **WHEN** the deleted product also has bottles in another cellar
- **THEN** those bottles and the product itself remain, and only ratings from the deleted bottles are gone from the product detail view

### Requirement: Swipe-to-delete is available only in Altglass
Rows in any cellar other than Altglass SHALL NOT be swipeable and SHALL NOT offer a delete icon. The application layer SHALL refuse to delete through this function any bottle that is not in the Altglass cellar, even if asked to.

#### Scenario: Regular cellar
- **WHEN** the user swipes a row to the left in a cellar other than Altglass
- **THEN** the row does not move and no delete icon appears

#### Scenario: Service guard
- **WHEN** the delete function is called with bottles of which some are not in Altglass
- **THEN** no bottle is deleted and an error is raised
