-- ========================================================
-- DEBUG: List Triggers on Budgets Table
-- ========================================================

-- 1. Create debug table
CREATE TABLE IF NOT EXISTS public.debug_log (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Debug Function
CREATE OR REPLACE FUNCTION debug_list_budget_triggers()
RETURNS VOID AS $$
DECLARE
    r RECORD;
BEGIN
    INSERT INTO public.debug_log (message) VALUES ('--- Starting Trigger Audit for table: budgets ---');

    FOR r IN (
        SELECT 
            trigger_name,
            event_manipulation,
            action_statement
        FROM information_schema.triggers
        WHERE event_object_table = 'budgets'
        AND event_object_schema = 'public'
    ) LOOP
        INSERT INTO public.debug_log (message) 
        VALUES (
            format('Trigger: %s | Event: %s | Action: %s', 
                r.trigger_name, 
                r.event_manipulation, 
                r.action_statement
            )
        );
    END LOOP;
    
    INSERT INTO public.debug_log (message) VALUES ('--- End of Trigger Audit ---');
END;
$$ LANGUAGE plpgsql;

-- 3. Run it
SELECT debug_list_budget_triggers();
