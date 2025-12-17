import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface BudgetItemInput {
  procedure_name: string;
  region: string;
  quantity: number;
  unit_value: number;
  total_value: number;
  procedure_id?: string;
}

interface BudgetCreateRequest {
  patient_id: string;
  doctor_id: string;
  price_table_id?: string;
  items: BudgetItemInput[];
  discount?: number;
  payment_config?: any;
}

interface BudgetCreateResponse {
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
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body: BudgetCreateRequest = await req.json();

    if (
      !body.patient_id ||
      !body.doctor_id ||
      !body.items ||
      body.items.length === 0
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Dados obrigatórios faltando: patient_id, doctor_id, items",
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

    // Validate patient exists
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("id", body.patient_id)
      .single();

    if (patientError || !patient) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Paciente não encontrado",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate doctor exists
    const { data: doctor, error: doctorError } = await supabase
      .from("users")
      .select("id")
      .eq("id", body.doctor_id)
      .single();

    if (doctorError || !doctor) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Doutor não encontrado",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Calculate totals
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

    // Create budget
    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .insert({
        patient_id: body.patient_id,
        doctor_id: body.doctor_id,
        price_table_id: body.price_table_id,
        status: "DRAFT",
        total_value: totalValue,
        discount: discount,
        final_value: finalValue,
        payment_config: body.payment_config,
      })
      .select()
      .single();

    if (budgetError) {
      throw budgetError;
    }

    // Create budget items
    const budgetItems = body.items.map((item) => ({
      budget_id: budget.id,
      procedure_id: item.procedure_id,
      procedure_name: item.procedure_name,
      region: item.region,
      quantity: item.quantity,
      unit_value: item.unit_value,
      total_value: item.total_value,
    }));

    const { error: itemsError } = await supabase
      .from("budget_items")
      .insert(budgetItems);

    if (itemsError) {
      // If items fail, delete the budget
      await supabase.from("budgets").delete().eq("id", budget.id);
      throw itemsError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Orçamento criado com sucesso",
        data: {
          budget_id: budget.id,
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
    console.error("Error creating budget:", error);
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
