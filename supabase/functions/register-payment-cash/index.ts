import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { installment_id, amount, payment_method, cash_register_id, notes } =
      await req.json();

    // Validar parâmetros obrigatórios
    if (!installment_id || !amount || !payment_method || !cash_register_id) {
      return new Response(
        JSON.stringify({
          error:
            "Parâmetros obrigatórios: installment_id, amount, payment_method, cash_register_id",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 1. Verificar se o caixa existe e está aberto
    const { data: cashRegister, error: registerError } = await supabaseClient
      .from("cash_registers")
      .select("id, status, clinic_id, opening_balance")
      .eq("id", cash_register_id)
      .eq("status", "OPEN")
      .single();

    if (registerError || !cashRegister) {
      return new Response(
        JSON.stringify({
          error:
            "Caixa não encontrado ou não está aberto. Verifique se existe um caixa aberto na clínica.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Verificar se a parcela pertence à mesma clínica do caixa
    const { data: installment, error: installmentError } = await supabaseClient
      .from("financial_installments")
      .select("id, clinic_id, patient_id, amount, amount_paid, description")
      .eq("id", installment_id)
      .single();

    if (installmentError || !installment) {
      return new Response(
        JSON.stringify({
          error: "Parcela não encontrada.",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (installment.clinic_id !== cashRegister.clinic_id) {
      return new Response(
        JSON.stringify({
          error: "Parcela não pertence à mesma clínica do caixa.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Calcular novo valor pago
    const currentPaid = installment.amount_paid || 0;
    const newPaidTotal = currentPaid + parseFloat(amount);
    const isFullyPaid = newPaidTotal >= installment.amount;

    if (parseFloat(amount) <= 0) {
      return new Response(
        JSON.stringify({
          error: "Valor do pagamento deve ser maior que zero.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (newPaidTotal > installment.amount) {
      return new Response(
        JSON.stringify({
          error: `Valor excede o total da parcela. Máximo permitido: R$ ${(
            installment.amount - currentPaid
          ).toFixed(2)}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 4. Executar transação atômica
    const { data, error: transactionError } = await supabaseClient.rpc(
      "register_payment_transaction",
      {
        p_installment_id: installment_id,
        p_amount: parseFloat(amount),
        p_payment_method: payment_method,
        p_cash_register_id: cash_register_id,
        p_notes: notes || "",
        p_date: new Date().toISOString().split("T")[0],
        p_is_fully_paid: isFullyPaid,
        p_new_paid_total: newPaidTotal,
      }
    );

    if (transactionError) {
      console.error("Transaction error:", transactionError);
      return new Response(
        JSON.stringify({
          error: "Erro ao processar pagamento: " + transactionError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Pagamento registrado com sucesso!",
        data: {
          installment_id,
          amount_paid: newPaidTotal,
          is_fully_paid: isFullyPaid,
          cash_register_id,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Erro interno do servidor: " + error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
