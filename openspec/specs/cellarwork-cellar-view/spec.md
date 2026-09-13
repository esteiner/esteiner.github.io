# cellarwork-cellar-view Specification

## Purpose

The well-known `cellarwork` cellar ("Kellerarbeit") is presented like any other cellar: selecting it opens its normal bottle-list view, and the specialized work display (the umbuchen/transfer grid) is a drill-in from the "Kellerarbeit" action in that view's header. Adding wine via the footer's photo flow also lands on the normal bottle view.

## Requirements

### Requirement: The cellarwork cellar opens to its normal bottle view

Selecting the well-known **cellarwork** cellar (labelled "Kellerarbeit") from the landing page SHALL open the **normal cellar view** — the same bottle-list view used for every other cellar — showing the bottles currently in that cellar. It SHALL NOT open the specialized work display directly.

#### Scenario: Selecting the cellarwork cellar shows its bottles
- **WHEN** the user selects the cellarwork ("Kellerarbeit") cellar on the landing page
- **THEN** the normal cellar view opens and lists the bottles in the cellarwork cellar
- **AND** the specialized work (umbuchen/transfer) display is not shown yet

### Requirement: The work display is a drill-in from the cellar view

From the cellarwork cellar's normal view, the user SHALL be able to switch to the specialized work display (the umbuchen/transfer grid) via the **"Kellerarbeit"** action in the header — the same action every cellar view offers. The work display remains its own view and is only shown on that action.

#### Scenario: Kellerarbeit action opens the work display
- **WHEN** the user activates the "Kellerarbeit" action in the cellarwork cellar's normal view
- **THEN** the specialized work display (umbuchen/transfer) is shown for that cellar

### Requirement: Adding via the footer lands on the normal cellarwork view

After the footer **Hinzufügen** photo flow ingests an order into the cellarwork cellar, the app SHALL navigate to the **normal cellarwork view** (its bottle list), showing the newly added bottles — not the work display.

#### Scenario: After a photo add, the bottle list is shown
- **WHEN** the footer photo flow finishes adding bottles to the cellarwork cellar
- **THEN** the normal cellarwork view is shown and reflects the newly added bottles
