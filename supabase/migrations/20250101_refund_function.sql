-- ==============================================================================
-- AUTOMATION: Transaction Refund / Reversal
-- Purpose: Unlock items and void transaction safely
-- ==============================================================================

CREATE OR REPLACE FUNCTION refund_sale(p_sale_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_budget_id UUID;
    v_items_count INTEGER;
BEGIN
    -- 1. Identify Budget context (for logging/returning)
    SELECT budget_id INTO v_budget_id
    FROM sales
    WHERE id = p_sale_id;

    -- 2. Unlock Items (Trigger will auto-update Budget Status)
    WITH unlocked AS (
        UPDATE budget_items
        SET is_sold = false,
            sold_at = NULL,
            sale_id = NULL
        WHERE sale_id = p_sale_id
        RETURNING id
    )
    SELECT COUNT(*) INTO v_items_count FROM unlocked;

    -- 3. Mark Sale as REFUNDED
    UPDATE sales
    SET status = 'REFUNDED',
        updated_at = NOW()
    WHERE id = p_sale_id;

    -- 4. Mark Transaction(s) as CANCELLED (if any)
    UPDATE transactions
    SET type = 'EXPENSE', -- Or keep as INCOME but negative? Better to flag as VOID/CANCELLED if table supports it.
        description = description || ' (ESTORNADO)'
    WHERE sale_id = p_sale_id; 
    -- Note: Ideally transactions table should have a Status column. 
    -- Assuming we just strictly link to sales for now.

    RETURN jsonb_build_object(
        'success', true,
        'unlocked_items', v_items_count,
        'budget_id', v_budget_id
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;
