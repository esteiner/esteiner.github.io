# bottle-rating Specification

## Purpose

Kellermeister lets a rating be stored on an individual bottle, persisted on the bottle's own RDF resource, while retaining the product's existing legacy array-valued rating for backward compatibility. The product detail view presents a single list of ratings aggregated from the product's bottles together with the product's legacy ratings, resolved without a per-render fetch.

## Requirements

### Requirement: A rating can be stored on an individual bottle

The system SHALL allow a rating to be stored on an individual `Bottle` as a single-valued `rating` property, persisted on the bottle's own RDF resource. Setting or changing a bottle's rating SHALL write only that bottle's resource and SHALL NOT rewrite the product resource.

#### Scenario: Set a rating on a bottle
- **WHEN** a rating is assigned to a bottle
- **THEN** the rating is persisted on that bottle's resource
- **AND** the product resource is not modified

#### Scenario: Change an existing bottle rating
- **WHEN** a bottle that already has a rating is given a new rating value
- **THEN** the bottle's single `rating` property is replaced with the new value
- **AND** no additional rating entry is created

#### Scenario: Bottle without a rating
- **WHEN** a bottle has never been rated
- **THEN** its `rating` property is empty and reading the bottle produces no error

### Requirement: The product's legacy rating array is retained

The system SHALL keep the existing array-valued `rating` property on the `Product` aggregate for backward compatibility. Existing product-level ratings SHALL continue to be read and written unchanged, and no migration of existing data is required.

#### Scenario: Existing product ratings still read
- **WHEN** a product that has ratings stored in its legacy `rating` array is loaded
- **THEN** those ratings are read from the product resource as before

#### Scenario: No migration of legacy ratings
- **WHEN** the change is deployed
- **THEN** existing product-level ratings remain on the product resource
- **AND** they are not moved onto bottles

### Requirement: The product detail view shows ratings aggregated from bottles and the product

The product detail view SHALL display a single list of ratings composed of the `rating` values of the product's bottles together with the entries of the product's legacy `rating` array. The aggregation SHALL be resolved without a per-render fetch, using the bottles already associated with the product.

#### Scenario: Ratings from bottles are listed
- **WHEN** a product whose bottles carry ratings is shown in the product detail view
- **THEN** each rated bottle's rating appears in the displayed rating list

#### Scenario: Legacy and bottle ratings are combined
- **WHEN** a product has both legacy product-level ratings and bottles that carry ratings
- **THEN** the displayed rating list contains ratings from both sources

#### Scenario: Product with no ratings anywhere
- **WHEN** a product has no legacy ratings and none of its bottles are rated
- **THEN** the displayed rating list is empty and no error occurs
