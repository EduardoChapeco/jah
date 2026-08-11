-- ============================================================================
-- Jah Commerce — Migration V4: Advanced Booking Engine
-- ============================================================================
-- Elevating the booking module to Belasis/Avec standards:
-- 1. Adds buffers (pre/post) and overbooking rules to services.
-- 2. Adds check-in / no-show explicit status to appointments.
-- 3. Creates CRM Clinical Records (Prontuários e Fichas de Anamnese).
-- ============================================================================

-- 1. Enhance `booking_services`
ALTER TABLE public.booking_services
ADD COLUMN IF NOT EXISTS buffer_minutes_before INTEGER DEFAULT 0 CHECK (buffer_minutes_before >= 0),
ADD COLUMN IF NOT EXISTS buffer_minutes_after INTEGER DEFAULT 0 CHECK (buffer_minutes_after >= 0),
ADD COLUMN IF NOT EXISTS allows_overbooking BOOLEAN DEFAULT false;

-- 2. Enhance `booking_appointments` (Add Checkin and No-Show statuses)
ALTER TABLE public.booking_appointments
DROP CONSTRAINT IF EXISTS booking_appointments_status_check;

ALTER TABLE public.booking_appointments
ADD CONSTRAINT booking_appointments_status_check 
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'checked_in', 'no_show', 'in_service'));

-- 3. Create CRM Clinical Records
CREATE TABLE IF NOT EXISTS public.crm_clinical_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- The staff member who wrote it
    appointment_id UUID REFERENCES public.booking_appointments(id) ON DELETE SET NULL,
    record_type TEXT NOT NULL DEFAULT 'anamnesis' CHECK (record_type IN ('anamnesis', 'evolution', 'allergy_warning', 'general_note')),
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]', -- URLs to photos/exams
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.crm_clinical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store staff can manage clinical records"
  ON public.crm_clinical_records FOR ALL TO authenticated
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'professional'])
  );

-- Customers generally should NOT read staff internal notes unless explicitly shared.
-- For now, restricted strictly to store staff.
