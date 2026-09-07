## ADDED Requirements

### Requirement: No-op sync makes no per-document fetches

A synchronization where no document has changed locally or on the Pod since the previous sync SHALL NOT issue any per-document Pod `GET`, and SHALL NOT write any document back to the Pod. Reading each collection container's listing (which carries every child's last-modified date) is the only per-collection Pod read a no-op sync performs.

#### Scenario: Nothing changed on either side

- **WHEN** a sync runs and no document has changed locally or on the Pod since the previous sync
- **THEN** the sync issues no per-document `GET` requests
- **AND** issues no document writes to the Pod

#### Scenario: Stable across repeated no-op syncs

- **WHEN** two no-op syncs run in succession
- **THEN** the second issues the same (zero) per-document `GET` count as the first
- **AND** does not re-fetch any document that the first left unchanged

### Requirement: Well-known cellars converge and are not re-fetched

The well-known cellars (`cellarwork`, `altglass`), which are created locally on every device and also exist on the Pod, SHALL converge so that a subsequent no-op sync skips them. After a sync, their locally recorded last-modified baseline SHALL equal the Pod's last-modified date for them.

#### Scenario: Well-known cellars skipped after convergence

- **WHEN** a device has synced with a Pod that already holds the well-known cellars
- **THEN** a following no-op sync does not fetch `cellarwork` or `altglass`
- **AND** does not repeatedly re-merge or rewrite them locally
