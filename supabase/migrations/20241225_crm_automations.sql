-- Create crm_automations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.crm_automations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pipeline_id uuid,
  stage_id uuid,
  trigger_event text CHECK (trigger_event = ANY (ARRAY['ENTER_STAGE'::text, 'EXIT_STAGE'::text, 'STAGNATED'::text, 'CREATED'::text])),
  action_type text CHECK (action_type = ANY (ARRAY['SEND_WHATSAPP'::text, 'CREATE_TASK'::text, 'CHANGE_OWNER'::text])),
  config jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT crm_automations_pkey PRIMARY KEY (id),
  CONSTRAINT crm_automations_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES public.crm_pipelines(id),
  CONSTRAINT crm_automations_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.crm_stages(id)
);

-- Create crm_automation_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.crm_automation_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  automation_id uuid,
  lead_id uuid,
  status text,
  result_data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT crm_automation_logs_pkey PRIMARY KEY (id),
  CONSTRAINT crm_automation_logs_automation_id_fkey FOREIGN KEY (automation_id) REFERENCES public.crm_automations(id),
  CONSTRAINT crm_automation_logs_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id)
);

-- RLS Policies
ALTER TABLE public.crm_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON public.crm_automations
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON public.crm_automation_logs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON public.crm_automation_logs
    FOR INSERT TO authenticated WITH CHECK (true);
