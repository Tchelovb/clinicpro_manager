import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface BudgetDeleteRequest {
  budget_id: string;
}

interface BudgetDeleteResponse {
  success: boolean;
  message: string;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "DELETE") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body: BudgetDeleteRequest = await req.json();

    if (!body.budget_id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "budget_id é obrigatório",
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

    // Check if budget exists and is not approved
    const { data: budget, error: checkError } = await supabase
      .from("budgets")
      .select("status")
      .eq("id", body.budget_id)
      .single();

    if (checkError || !budget) {
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

    if (budget.status === "APPROVED") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Não é possível excluir orçamento aprovado",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Delete budget items first (due to FK constraint)
    const { error: deleteItemsError } = await supabase
      .from("budget_items")
      .delete()
      .eq("budget_id", body.budget_id);

    if (deleteItemsError) {
      throw deleteItemsError;
    }

    // Delete budget
    const { error: deleteBudgetError } = await supabase
      .from("budgets")
      .delete()
      .eq("id", body.budget_id);

    if (deleteBudgetError) {
      throw deleteBudgetError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Orçamento excluído com sucesso",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error deleting budget:", error);
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
