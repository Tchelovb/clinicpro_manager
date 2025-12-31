-- SEED DATA FOR SALES TERMINAL TEST
-- 1. Create Test Patient
INSERT INTO patients (id, name, cpf, phone, created_at)
VALUES 
    ('00000000-0000-0000-0000-000000000099', 'Maria Teste PDV', '999.999.999-99', '11999999999', NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Create Test Budget (Status: PENDING i.e., Approved by patient, waiting payment)
INSERT INTO budgets (id, patient_id, title, status, total_value, created_at)
VALUES 
    ('00000000-0000-0000-0000-000000000088', '00000000-0000-0000-0000-000000000099', 'Orçamento Estético Completo', 'PENDING', 3500.00, NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Create Budget Items (These effectively become treatment_items with status 'BUDGETED')
-- Note: In our system, items are usually in 'treatment_items' linked to budget.
-- Let's check the schema logic: usually 'budgets' have 'budget_items' OR 'treatment_items' are linked.
-- Based on previous context, we update 'treatment_items'.
-- Let's insert into treatment_items directly with budget_id set.

INSERT INTO treatment_items (id, patient_id, budget_id, procedure_name, unit_value, total_value, quantity, status, tooth_number, face)
VALUES
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000099', '00000000-0000-0000-0000-000000000088', 'Profilaxia (Limpeza)', 200.00, 200.00, 1, 'BUDGETED', null, null),
    ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000099', '00000000-0000-0000-0000-000000000088', 'Clareamento Laser', 1500.00, 1500.00, 1, 'BUDGETED', null, null),
    ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000099', '00000000-0000-0000-0000-000000000088', 'Restauração Resina', 300.00, 300.00, 1, 'BUDGETED', 16, 'O')
ON CONFLICT (id) DO NOTHING;

-- 4. Also insert into budget_items if that table exists (Double check if we use a separate table or just treatment_items)
-- Based on BudgetSelector.tsx: "budget.items"
-- Based on useBudgets.ts, we usually fetch items via a join or from treatment_items.
-- Let's assume for this test that the API View handles the join, or we need to populate both if they are separate.
-- BUT, looking at `SmartCart.tsx`, it iterates `budget.items`.
-- Let's assume the view/query pulls from `treatment_items` where budget_id matches, OR there is a `budget_items` table.
-- To be safe, I'll inspect the `budgets` table relations if I can, but inserting into `treatment_items` is the Critical Path for the "Pulo do Gato" (Status Update).
