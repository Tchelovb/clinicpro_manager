import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface BudgetItemInput {
  procedure_name: string;
  region: string;
  quantity: number;
  unit_value: number;
  total_value: number;
  procedure_id?: string;
}

interface BudgetUpdateRequest {
  budget_id: string;
  items: BudgetItemInput[];
  discount?: number;
  payment_config?: any;
}

interface BudgetUpdateResponse {
  success: boolean;
  message: string;
  data?: {
    budget_id: string;
    total_value: number;
    final_value: number;
    items_count: number;
  };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "PUT") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body: BudgetUpdateRequest = await req.json();

    if (!body.budget_id || !body.items) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Dados obrigatórios faltando: budget_id, items",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if budget exists and is editable (not approved)
    const { data: existingBudget, error: budgetCheckError } = await supabase
      .from("budgets")
      .select("status")
      .eq("id", body.budget_id)
      .single();

    if (budgetCheckError || !existingBudget) {
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

    if (existingBudget.status === "APPROVED") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Não é possível editar orçamento aprovado",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Calculate new totals
    let totalValue = 0;
    for (const item of body.items) {
      if (item.quantity <= 0 || item.unit_value <= 0) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Quantidade e valor unitário devem ser positivos",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      totalValue += item.total_value;
    }

    const discount = body.discount || 0;
    if (discount < 0 || discount > totalValue) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Desconto inválido",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const finalValue = totalValue - discount;

    // Update budget
    const { error: budgetUpdateError } = await supabase
      .from("budgets")
      .update({
        total_value: totalValue,
        discount: discount,
        final_value: finalValue,
        payment_config: body.payment_config,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.budget_id);

    if (budgetUpdateError) {
      throw budgetUpdateError;
    }

    // Delete existing items
    const { error: deleteItemsError } = await supabase
      .from("budget_items")
      .delete()
      .eq("budget_id", body.budget_id);

    if (deleteItemsError) {
      throw deleteItemsError;
    }

    // Insert new items
    const budgetItems = body.items.map((item) => ({
      budget_id: body.budget_id,
      procedure_id: item.procedure_id,
      procedure_name: item.procedure_name,
      region: item.region,
      quantity: item.quantity,
      unit_value: item.unit_value,
      total_value: item.total_value,
    }));

    const { error: insertItemsError } = await supabase
      .from("budget_items")
      .insert(budgetItems);

    if (insertItemsError) {
      throw insertItemsError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Orçamento atualizado com sucesso",
        data: {
          budget_id: body.budget_id,
          total_value: totalValue,
          final_value: finalValue,
          items_count: body.items.length,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating budget:", error);
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
