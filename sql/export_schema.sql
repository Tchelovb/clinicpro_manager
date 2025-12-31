-- Script to export complete database schema
-- Run this in Supabase SQL Editor to generate the complete schema

-- Export all table definitions
SELECT 
    'CREATE TABLE ' || schemaname || '.' || tablename || ' (' || 
    string_agg(
        column_name || ' ' || data_type || 
        CASE WHEN character_maximum_length IS NOT NULL 
            THEN '(' || character_maximum_length || ')' 
            ELSE '' 
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL 
            THEN ' DEFAULT ' || column_default 
            ELSE '' 
        END,
        ', '
    ) || ');'
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Note: For a complete schema export, use:
-- pg_dump --schema-only --no-owner --no-privileges your_database_url > schema.sql
