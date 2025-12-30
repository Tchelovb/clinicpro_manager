-- DEDUPLICATE USERS AND ENFORCE UNIQUENESS

-- 1. Identify and Remove Duplicates (Keep the most recent or the one with a professional_id)
-- Strategy: Use a CTE to find duplicates and row_number to identify which to delete.
-- We prioritize records that have a linked professional_id or are more recent.

DELETE FROM public.users
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY email 
        ORDER BY 
          -- Prioritize records with professional_id (assuming they are more complete)
          (professional_id IS NOT NULL) DESC,
          -- Then prioritize most recently updated/created
          created_at DESC
      ) as rn
    FROM public.users
    WHERE email IS NOT NULL
  ) t
  WHERE t.rn > 1
);

-- 2. Add Unique Constraint to public.users email
ALTER TABLE public.users
ADD CONSTRAINT users_email_key UNIQUE (email);

-- 3. Verify clean state
SELECT email, count(*) 
FROM public.users 
GROUP BY email 
HAVING count(*) > 1;
