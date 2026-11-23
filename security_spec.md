# Security Specification — Elza Shop Firestore

## Data Invariants
1. **Product Ownership & Auth**: Only verified administrators (`swag007qq@gmail.com` or UID present in `/admins/{uid}`) may create, update, or delete documents in `/products/{productId}`.
2. **Public Catalog Visibility**: Unauthenticated visitors may only list or read `/products/{productId}` where `isPublished == true`.
3. **Immutable Audit Fields**: On product updates, `createdBy` and `createdAt` must remain unchanged; `updatedAt` must equal `request.time`.
4. **Strict Payload Boundaries**: Every string field enforces strict `.size()` caps (`title` 1–80, `currency` 1–16, `image` 1–2048, `subtitle` <= 140), `price` must be a non-negative number `<= 1000000`, and unknown shadow fields are rejected via `hasOnly()`.
5. **Path Variable Hardening**: Document IDs (`productId`, `adminUid`) must match `^[a-zA-Z0-9_\-]+$` with max length 128.

## Dirty Dozen Payloads (All Must Yield PERMISSION_DENIED)
1. Unauthenticated `create` on `/products/p1` -> DENIED (`request.auth == null`).
2. Signed-in non-admin user `create` on `/products/p1` -> DENIED (`!isAdmin()`).
3. Admin with unverified email (`email_verified == false`) `create` on `/products/p1` -> DENIED.
4. Admin `create` with shadow field `{ ..., isAdminOverride: true }` -> DENIED (`hasOnly()`).
5. Admin `create` with oversized `title` (81+ chars) or empty `title` -> DENIED.
6. Admin `create` with negative `price: -50` or string `price: "299"` -> DENIED.
7. Admin `create` with oversized `image` (> 2048 chars) -> DENIED.
8. Admin `create` with spoofed `createdBy` != `request.auth.uid` -> DENIED.
9. Admin `create` with client-forged `createdAt` != `request.time` -> DENIED.
10. Admin `update` modifying immutable `createdAt` or `createdBy` -> DENIED.
11. Unauthenticated `list` on `/products` without `where('isPublished', '==', true)` -> DENIED (`resource.data.isPublished == true`).
12. Non-admin `create` or `read` on `/admins/{uid}` -> DENIED.
