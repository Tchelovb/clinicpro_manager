-- Add opportunity_id to lead_interactions table
ALTER TABLE public.lead_interactions 
ADD COLUMN IF NOT EXISTS opportunity_id uuid REFERENCES public.crm_opportunities(id);

-- Optional: Add index for performance optimization when querying by opportunity
CREATE INDEX IF NOT EXISTS idx_lead_interactions_opportunity_id ON public.lead_interactions(opportunity_id);

-- Add comment
COMMENT ON COLUMN public.lead_interactions.opportunity_id IS 'Link interaction to a specific opportunity for contextual negotiation history';
