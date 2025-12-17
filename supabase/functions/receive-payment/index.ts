import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface PaymentRequest {
  installmentId: string;
  amount: number;
  method: string;
  date: string;
  notes?: string;
}

interface PaymentResponse {
  success: boolean;
  message: string;
  data?: any;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { installmentId, amount, method, date, notes }: PaymentRequest =
      await req.json();

    if (!installmentId || !amount || !method || !date) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
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

    // Get installment details
    const { data: installment, error: installmentError } = await supabase
      .from("financial_installments")
      .select("*")
      .eq("id", installmentId)
      .single();

    if (installmentError || !installment) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Parcela não encontrada",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if there's an open cash register
    const { data: openRegister, error: registerError } = await supabase
      .from("cash_registers")
      .select("*")
      .eq("status", "Aberto")
      .eq("clinic_id", installment.clinic_id)
      .single();

    if (registerError || !openRegister) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Não há caixa aberto para registrar o pagamento",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Calculate new amounts
    const currentPaid = installment.amount_paid || 0;
    const newPaidTotal = currentPaid + amount;
    const isFullyPaid = newPaidTotal >= installment.amount;
    const finalStatus = isFullyPaid ? "PAID" : "PARTIAL";

    // Update installment
    const { error: updateInstallmentError } = await supabase
      .from("financial_installments")
      .update({
        amount_paid: newPaidTotal,
        status: finalStatus,
        payment_method: method,
      })
      .eq("id", installmentId);

    if (updateInstallmentError) {
      throw updateInstallmentError;
    }

    // Add payment history
    const { error: historyError } = await supabase
      .from("payment_history")
      .insert([
        {
          installment_id: installmentId,
          amount,
          date,
          method,
          notes,
        },
      ]);

    if (historyError) {
      throw historyError;
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert([
        {
          clinic_id: installment.clinic_id,
          cash_register_id: openRegister.id,
          description: `Recebimento: ${installment.description}`,
          amount,
          type: "INCOME",
          category: "Tratamentos",
          date,
          payment_method: method,
        },
      ])
      .select()
      .single();

    if (transactionError) {
      throw transactionError;
    }

    // Link transaction to payment history
    const { error: linkError } = await supabase
      .from("payment_history")
      .update({ transaction_id: transaction.id })
      .eq("installment_id", installmentId)
      .eq("amount", amount)
      .eq("date", date);

    if (linkError) {
      console.error("Error linking transaction:", linkError);
    }

    // Update cash register balance
    const { error: registerUpdateError } = await supabase
      .from("cash_registers")
      .update({
        calculated_balance: openRegister.calculated_balance + amount,
      })
      .eq("id", openRegister.id);

    if (registerUpdateError) {
      throw registerUpdateError;
    }

    // Update patient totals
    const { data: patient } = await supabase
      .from("patients")
      .select("total_paid, balance_due")
      .eq("id", installment.patient_id)
      .single();

    const newTotalPaid = (patient?.total_paid || 0) + amount;
    const newBalanceDue = (patient?.balance_due || 0) - amount;

    const { error: patientUpdateError } = await supabase
      .from("patients")
      .update({
        total_paid: newTotalPaid,
        balance_due: newBalanceDue,
      })
      .eq("id", installment.patient_id);

    if (patientUpdateError) {
      throw patientUpdateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Pagamento registrado com sucesso",
        data: {
          installmentId,
          amount,
          newPaidTotal,
          finalStatus,
          transactionId: transaction.id,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing payment:", error);

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
