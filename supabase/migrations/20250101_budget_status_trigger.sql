-- ==============================================================================
-- AUTOMATION: Budget Status Lifecycle
-- Purpose: Automatically update budget status based on item sales
-- ==============================================================================

CREATE OR REPLACE FUNCTION update_budget_status_on_item_change()
RETURNS TRIGGER AS $$
DECLARE
    v_budget_id UUID;
    v_total_items INTEGER;
    v_sold_items INTEGER;
    v_current_status TEXT;
    v_new_status TEXT;
BEGIN
    -- Determine Budget ID based on operation
    IF (TG_OP = 'DELETE') THEN
        v_budget_id := OLD.budget_id;
    ELSE
        v_budget_id := NEW.budget_id;
    END IF;

    -- Get current status
    SELECT status INTO v_current_status FROM budgets WHERE id = v_budget_id;

    -- Count items for this budget
    SELECT COUNT(*), COUNT(*) FILTER (WHERE is_sold = true)
    INTO v_total_items, v_sold_items
    FROM budget_items
    WHERE budget_id = v_budget_id;

    -- Determine New Status
    IF v_sold_items = 0 THEN
        -- If it was APPROVED, keep it APPROVED. If it was WAIT_CLOSING, keep it.
        -- Basically, if nothing is sold, revert to 'APPROVED' only if it was 'PARTIALLY_PAID' or 'PAID'
        IF v_current_status IN ('PARTIALLY_PAID', 'PAID') THEN
             v_new_status := 'APPROVED';
        ELSE
             v_new_status := v_current_status;
        END IF;
    ELSIF v_sold_items = v_total_items THEN
        v_new_status := 'PAID';
    ELSE
        v_new_status := 'PARTIALLY_PAID';
    END IF;

    -- Update Budget if status changed
    IF v_new_status IS DISTINCT FROM v_current_status THEN
        UPDATE budgets 
        SET status = v_new_status,
            updated_at = NOW()
        WHERE id = v_budget_id;
        
        RAISE NOTICE '🔄 Budget % status updated: % -> %', v_budget_id, v_current_status, v_new_status;
    END IF;

    RETURN NULL; -- Result is ignored for AFTER triggers
END;
$$ LANGUAGE plpgsql;

-- Trigger for UPDATE (when items are marked sold/unsold)
DROP TRIGGER IF EXISTS trigger_update_budget_status ON budget_items;
CREATE TRIGGER trigger_update_budget_status
AFTER UPDATE OF is_sold ON budget_items
FOR EACH ROW
EXECUTE FUNCTION update_budget_status_on_item_change();

-- Trigger for INSERT/DELETE (if items are added/removed to a live budget)
DROP TRIGGER IF EXISTS trigger_update_budget_status_count ON budget_items;
CREATE TRIGGER trigger_update_budget_status_count
AFTER INSERT OR DELETE ON budget_items
FOR EACH ROW
EXECUTE FUNCTION update_budget_status_on_item_change();
