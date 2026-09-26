# wine-type-colour-filter Specification

## Purpose
Defines how the Weinart filters (Sprudel, Dessert) and the colour filters (Weiss, Rot, Rosé) combine when filtering products.
## Requirements
### Requirement: A colour filter alone selects still wine of that colour
When a colour filter (Weiss, Rot or Rosé) is active and no Weinart filter (Sprudel, Dessert) is active, a product SHALL match only if its Weinfarbe matches the colour and its Weinart is the corresponding still wine type: Weiss → `Weisswein`, Rot → `Rotwein`, Rosé → `Rosewein`. A product without a Weinart or Weinfarbe SHALL be treated as matching that attribute.

#### Scenario: White filter excludes sparkling white
- **WHEN** only the Weiss filter is active and a product is `Schaumwein` / `weiss`
- **THEN** the product does not match

#### Scenario: White filter matches still white
- **WHEN** only the Weiss filter is active and a product is `Weisswein` / `weiss`
- **THEN** the product matches

#### Scenario: Red and Rosé map to their wine types
- **WHEN** only the Rot filter is active
- **THEN** a `Rotwein` / `rot` product matches and a `Schaumwein` / `rot` product does not
- **WHEN** only the Rosé filter is active
- **THEN** a `Rosewein` / `rose` product matches and a `Schaumwein` / `rose` product does not

#### Scenario: Generic or dessert wine type does not match a colour alone
- **WHEN** only the Weiss filter is active and a product is `Wein` / `weiss` or `Dessertwein` / `weiss`
- **THEN** the product does not match

#### Scenario: Missing Weinart is treated as a match
- **WHEN** only the Rot filter is active and a product has Weinfarbe `rot` and no Weinart
- **THEN** the product matches

### Requirement: Sprudel with a colour selects sparkling wine of that colour
When the Sprudel filter and a colour filter are both active, a product SHALL match only if its Weinart is `Schaumwein` and its Weinfarbe matches the colour. The still-wine Weinart SHALL NOT be required.

#### Scenario: Sprudel and Rosé
- **WHEN** Sprudel and Rosé are active
- **THEN** a `Schaumwein` / `rose` product matches, and a `Rosewein` / `rose` product does not

### Requirement: Dessert with a colour selects dessert wine of that colour
When the Dessert filter and a colour filter are both active, a product SHALL match only if its Weinart is `Dessertwein` and its Weinfarbe matches the colour. The still-wine Weinart SHALL NOT be required.

#### Scenario: Dessert and Weiss
- **WHEN** Dessert and Weiss are active
- **THEN** a `Dessertwein` / `weiss` product matches, and a `Weisswein` / `weiss` product does not

