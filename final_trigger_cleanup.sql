-- Final safety check for zombie triggers
DROP TRIGGER IF EXISTS "sync_budget_stock_trigger" ON public.budgets;
DROP TRIGGER IF EXISTS "update_budget_items_stock" ON public.budgets;
