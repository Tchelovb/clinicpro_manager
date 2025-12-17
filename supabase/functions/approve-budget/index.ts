import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface BudgetApprovalRequest {
  budgetId: string;
}

interface BudgetApprovalResponse {
  success: boolean;
  message: string;
  data?: any;
}

Deno.serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { budgetId }: BudgetApprovalRequest = await req.json();

    if (!budgetId) {
      return new Response(JSON.stringify({ error: "Budget ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client with service role for Edge Functions
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Start transaction - get budget details
    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .select("*, budget_items (*)")
      .eq("id", budgetId)
      .single();

    if (budgetError || !budget) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Orçamento não encontrado",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update budget status to APPROVED
    const { error: updateBudgetError } = await supabase
      .from("budgets")
      .update({ status: "APPROVED" })
      .eq("id", budgetId);

    if (updateBudgetError) {
      throw updateBudgetError;
    }

    // Create treatment items from budget items
    const treatmentItems = budget.budget_items.map((item: any) => ({
      patient_id: budget.patient_id,
      budget_id: budget.id,
      procedure_name: item.procedure_name,
      region: item.region,
      status: "NOT_STARTED",
      doctor_id: budget.doctor_id,
    }));

    const { error: treatmentsError } = await supabase
      .from("treatment_items")
      .insert(treatmentItems);

    if (treatmentsError) {
      throw treatmentsError;
    }

    // Create financial installments
    const paymentConfig = budget.payment_config || {
      method: "Boleto",
      installments: 1,
    };
    const installmentsCount = paymentConfig.installments || 1;
    const installmentAmount = budget.final_value / installmentsCount;

    const installments = [];
    for (let i = 0; i < installmentsCount; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i + 1); // Next month + i

      installments.push({
        patient_id: budget.patient_id,
        clinic_id: budget.clinic_id,
        description: `Orçamento #${budgetId} - Parc. ${
          i + 1
        }/${installmentsCount}`,
        due_date: dueDate.toISOString().split("T")[0],
        amount: installmentAmount,
        amount_paid: 0,
        status: "PENDING",
        payment_method: paymentConfig.method || "Boleto",
      });
    }

    const { error: installmentsError } = await supabase
      .from("financial_installments")
      .insert(installments);

    if (installmentsError) {
      throw installmentsError;
    }

    // Update patient totals
    const totalApproved = budget.final_value;

    // Get current patient totals
    const { data: patient } = await supabase
      .from("patients")
      .select("total_approved, balance_due")
      .eq("id", budget.patient_id)
      .single();

    const newTotalApproved = (patient?.total_approved || 0) + totalApproved;
    const newBalanceDue = (patient?.balance_due || 0) + totalApproved;

    const { error: patientUpdateError } = await supabase
      .from("patients")
      .update({
        total_approved: newTotalApproved,
        balance_due: newBalanceDue,
      })
      .eq("id", budget.patient_id);

    if (patientUpdateError) {
      throw patientUpdateError;
    }

    // Close associated lead if exists
    const { data: linkedLead } = await supabase
      .from("leads")
      .select("id")
      .eq("budget_id", budgetId)
      .single();

    if (linkedLead) {
      const { error: leadUpdateError } = await supabase
        .from("leads")
        .update({ status: "WON" })
        .eq("id", linkedLead.id);

      if (leadUpdateError) {
        console.error("Error updating lead:", leadUpdateError);
        // Don't fail the entire transaction for this
      }

      // Add interaction to lead
      const { error: interactionError } = await supabase
        .from("lead_interactions")
        .insert([
          {
            lead_id: linkedLead.id,
            user_id: budget.doctor_id,
            type: "System",
            content: `Orçamento #${budgetId} aprovado. Oportunidade ganha!`,
            created_at: new Date().toISOString(),
          },
        ]);

      if (interactionError) {
        console.error("Error creating interaction:", interactionError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Orçamento aprovado com sucesso",
        data: {
          budgetId,
          treatmentsCreated: treatmentItems.length,
          installmentsCreated: installments.length,
          totalApproved,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error approving budget:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
