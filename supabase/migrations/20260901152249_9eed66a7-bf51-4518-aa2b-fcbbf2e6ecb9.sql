
CREATE TABLE public.weekly_task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id text NOT NULL DEFAULT 'bar512',
  title text NOT NULL,
  description text,
  area text,
  category text,
  priority text NOT NULL DEFAULT 'normal',
  estimated_minutes integer,
  recurrence text NOT NULL DEFAULT 'weekly',
  active boolean NOT NULL DEFAULT true,
  archived boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  visible_to_all boolean NOT NULL DEFAULT true,
  assigned_usernames text[] NOT NULL DEFAULT '{}',
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_task_templates TO authenticated, anon;
GRANT ALL ON public.weekly_task_templates TO service_role;
ALTER TABLE public.weekly_task_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view weekly task templates" ON public.weekly_task_templates FOR SELECT USING (true);
CREATE POLICY "Anyone can insert weekly task templates" ON public.weekly_task_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update weekly task templates" ON public.weekly_task_templates FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete weekly task templates" ON public.weekly_task_templates FOR DELETE USING (true);
CREATE TRIGGER update_weekly_task_templates_updated_at BEFORE UPDATE ON public.weekly_task_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.weekly_task_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id text NOT NULL DEFAULT 'bar512',
  template_id uuid REFERENCES public.weekly_task_templates(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  area text,
  category text,
  priority text NOT NULL DEFAULT 'normal',
  estimated_minutes integer,
  sort_order integer NOT NULL DEFAULT 0,
  week_start date NOT NULL,
  due_date date,
  status text NOT NULL DEFAULT 'pending',
  note text,
  completed_by text,
  completed_at timestamptz,
  skipped_by text,
  skipped_at timestamptz,
  skipped_reason text,
  reopened_by text,
  reopened_at timestamptz,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, week_start)
);
CREATE INDEX weekly_task_instances_week_idx ON public.weekly_task_instances (department_id, week_start);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_task_instances TO authenticated, anon;
GRANT ALL ON public.weekly_task_instances TO service_role;
ALTER TABLE public.weekly_task_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view weekly task instances" ON public.weekly_task_instances FOR SELECT USING (true);
CREATE POLICY "Anyone can insert weekly task instances" ON public.weekly_task_instances FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update weekly task instances" ON public.weekly_task_instances FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete weekly task instances" ON public.weekly_task_instances FOR DELETE USING (true);
CREATE TRIGGER update_weekly_task_instances_updated_at BEFORE UPDATE ON public.weekly_task_instances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.weekly_task_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id text NOT NULL DEFAULT 'bar512',
  instance_id uuid REFERENCES public.weekly_task_instances(id) ON DELETE CASCADE,
  template_id uuid,
  week_start date,
  action text NOT NULL,
  username text,
  note text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX weekly_task_activity_log_instance_idx ON public.weekly_task_activity_log (instance_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_task_activity_log TO authenticated, anon;
GRANT ALL ON public.weekly_task_activity_log TO service_role;
ALTER TABLE public.weekly_task_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view weekly task activity log" ON public.weekly_task_activity_log FOR SELECT USING (true);
CREATE POLICY "Anyone can insert weekly task activity log" ON public.weekly_task_activity_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update weekly task activity log" ON public.weekly_task_activity_log FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete weekly task activity log" ON public.weekly_task_activity_log FOR DELETE USING (true);
