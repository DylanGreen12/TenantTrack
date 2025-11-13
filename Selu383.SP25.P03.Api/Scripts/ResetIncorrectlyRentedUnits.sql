-- Reset units that are marked as "Rented" but don't have an active lease
-- This fixes the issue where units were incorrectly marked as "Rented" when tenants were created
-- (before the code fix that only marks units as "Rented" when payment is confirmed)

-- Update units to "Available" if they are marked "Rented" but have no active lease
UPDATE Units
SET Status = 'Available'
WHERE Status = 'Rented'
AND Id IN (
    SELECT u.Id
    FROM Units u
    LEFT JOIN Tenants t ON t.UnitId = u.Id
    LEFT JOIN Leases l ON l.TenantId = t.Id AND l.Status = 'Active'
    WHERE u.Status = 'Rented'
    AND l.Id IS NULL
)

-- Show the results
SELECT
    u.Id,
    u.UnitNumber,
    u.Status,
    t.Id AS TenantId,
    t.FirstName + ' ' + t.LastName AS TenantName,
    l.Status AS LeaseStatus
FROM Units u
LEFT JOIN Tenants t ON t.UnitId = u.Id
LEFT JOIN Leases l ON l.TenantId = t.Id
ORDER BY u.Id
