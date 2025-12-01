-- Set EmailConfirmed = true for a specific user (for testing purposes)
-- Replace 'your-username-here' with the actual username of your landlord account

-- First, let's see all users and their email confirmation status
SELECT
    Id,
    UserName,
    Email,
    EmailConfirmed,
    PhoneNumber
FROM AspNetUsers
ORDER BY UserName;

-- Uncomment and run this to set EmailConfirmed = true for a specific user:
-- UPDATE AspNetUsers
-- SET EmailConfirmed = 1
-- WHERE UserName = 'your-username-here';

-- Or if you want to set it for ALL landlord users for testing:
-- UPDATE AspNetUsers
-- SET EmailConfirmed = 1
-- WHERE Id IN (
--     SELECT UserId
--     FROM AspNetUserRoles
--     WHERE RoleId IN (
--         SELECT Id
--         FROM AspNetRoles
--         WHERE Name = 'Landlord'
--     )
-- );
