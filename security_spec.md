# Security Specification: CEMIL Management System

## 1. Data Invariants
- A Worker must have a valid `role`.
- A Participant's `currentStatus` must be one of the allowed enums.
- An Evolution must belong to a Participant and be created by a Worker.
- Logs are strictly immutable (create-only).

## 2. The "Dirty Dozen" Payloads (Deny Test Cases)
1. **Identity Spoofing**: User A tries to create a Participant with `ownerId: UserB`. (Wait, Participants aren't strictly "owned", but registered. Registration should be allowed only for certain roles).
2. **Privilege Escalation**: A `VOLUNTARIO` tries to upgrade themselves to `ADMIN`.
3. **Ghost Field Injection**: Adding `isVerified: true` to a Worker document.
4. **ID Poisoning**: Creating a Sector with an ID that is 1MB long.
5. **Relational Orphan**: Creating an Evolution for a `participantId` that doesn't exist.
6. **PII Leak**: A `VOLUNTARIO` trying to read `participants` list (permitted by current matrix for visibility, but PII access should be guarded). Actually, matrix says Voluntário has strict access, so maybe they shouldn't read PII-heavy list.
7. **Negative Timestamp**: Setting `createdAt: -1`.
8. **Update Gap**: Updating a Sector name while also changing its ID (if ID was mutable).
9. **Status Shortcut**: Jumping Participant status from `IDLE` to `COMPLETED` without an `IN_SERVICE` record.
10. **Shadow Worker**: Creating a Worker with a fake `email_verified: true` (if we relied on that).
11. **Log Tampering**: Attempting to `delete` an `AuditLog`.
12. **Sector Bypass**: A COORD changing data for a Sector they don't lead.

## 3. Test Runner (Drafting Rules Logic)
- `isValidId(id)`: id is string && id.size() <= 128
- `isRole(role)`: role in ['ADMIN', 'COORDENADOR', 'SECRETARIO', 'RECEPCIONISTA', 'ATENDENTE', 'VOLUNTARIO']
- `isAdmin()`: get worker data for auth.uid and check role == 'ADMIN'.
...
