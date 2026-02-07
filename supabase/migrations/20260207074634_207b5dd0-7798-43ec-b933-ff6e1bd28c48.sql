-- إضافة أعمدة جديدة لميزات المطعم
ALTER TABLE public.restaurant_features 
ADD COLUMN IF NOT EXISTS can_manage_sub_users BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_sub_users INTEGER DEFAULT 3;

-- جدول المستخدمين الفرعيين للمطعم
CREATE TABLE public.restaurant_sub_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(restaurant_id, user_id)
);

-- جدول صلاحيات المستخدمين الفرعيين
CREATE TABLE public.restaurant_sub_user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_user_id UUID NOT NULL REFERENCES public.restaurant_sub_users(id) ON DELETE CASCADE,
  can_see_prices BOOLEAN DEFAULT true,
  can_see_favorite_suppliers_only BOOLEAN DEFAULT false,
  can_see_favorite_products_only BOOLEAN DEFAULT false,
  can_edit_order BOOLEAN DEFAULT false,
  can_cancel_order BOOLEAN DEFAULT false,
  can_approve_order BOOLEAN DEFAULT true,
  can_see_order_totals BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(sub_user_id)
);

-- جدول ربط المستخدمين الفرعيين بالفروع (باستخدام جدول branches الموجود)
CREATE TABLE public.restaurant_sub_user_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_user_id UUID NOT NULL REFERENCES public.restaurant_sub_users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(sub_user_id, branch_id)
);

-- جدول طلبات الموافقة على الطلبات
CREATE TABLE public.order_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.restaurant_sub_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_sub_user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_sub_user_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_approval_requests ENABLE ROW LEVEL SECURITY;

-- دالة للتحقق إذا المستخدم هو مدير المطعم أو مستخدم فرعي
CREATE OR REPLACE FUNCTION public.get_restaurant_owner_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT restaurant_id FROM public.restaurant_sub_users WHERE user_id = _user_id LIMIT 1),
    _user_id
  )
$$;

-- دالة للتحقق إذا المستخدم مستخدم فرعي
CREATE OR REPLACE FUNCTION public.is_sub_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.restaurant_sub_users 
    WHERE user_id = _user_id AND is_active = true
  )
$$;

-- دالة للحصول على صلاحيات المستخدم الفرعي
CREATE OR REPLACE FUNCTION public.get_sub_user_permissions(_user_id uuid)
RETURNS TABLE(
  can_see_prices boolean,
  can_see_favorite_suppliers_only boolean,
  can_see_favorite_products_only boolean,
  can_edit_order boolean,
  can_cancel_order boolean,
  can_approve_order boolean,
  can_see_order_totals boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.can_see_prices,
    p.can_see_favorite_suppliers_only,
    p.can_see_favorite_products_only,
    p.can_edit_order,
    p.can_cancel_order,
    p.can_approve_order,
    p.can_see_order_totals
  FROM public.restaurant_sub_user_permissions p
  JOIN public.restaurant_sub_users su ON su.id = p.sub_user_id
  WHERE su.user_id = _user_id AND su.is_active = true
  LIMIT 1
$$;

-- دالة للحصول على فروع المستخدم الفرعي
CREATE OR REPLACE FUNCTION public.get_sub_user_branches(_user_id uuid)
RETURNS TABLE(branch_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.branch_id
  FROM public.restaurant_sub_user_branches b
  JOIN public.restaurant_sub_users su ON su.id = b.sub_user_id
  WHERE su.user_id = _user_id AND su.is_active = true
$$;

-- RLS Policies for restaurant_sub_users
CREATE POLICY "Restaurant owners can manage their sub users"
ON public.restaurant_sub_users
FOR ALL
USING (restaurant_id = auth.uid() OR user_id = auth.uid())
WITH CHECK (restaurant_id = auth.uid());

CREATE POLICY "Admins can view all sub users"
ON public.restaurant_sub_users
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for restaurant_sub_user_permissions
CREATE POLICY "Restaurant owners can manage sub user permissions"
ON public.restaurant_sub_user_permissions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.restaurant_sub_users su
    WHERE su.id = sub_user_id AND (su.restaurant_id = auth.uid() OR su.user_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.restaurant_sub_users su
    WHERE su.id = sub_user_id AND su.restaurant_id = auth.uid()
  )
);

-- RLS Policies for restaurant_sub_user_branches
CREATE POLICY "Restaurant owners can manage sub user branches"
ON public.restaurant_sub_user_branches
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.restaurant_sub_users su
    WHERE su.id = sub_user_id AND (su.restaurant_id = auth.uid() OR su.user_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.restaurant_sub_users su
    WHERE su.id = sub_user_id AND su.restaurant_id = auth.uid()
  )
);

-- RLS Policies for order_approval_requests
CREATE POLICY "Users can view their approval requests"
ON public.order_approval_requests
FOR SELECT
USING (
  requested_by = auth.uid() 
  OR approved_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id AND o.restaurant_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.restaurant_sub_users su
    WHERE su.user_id = auth.uid() 
    AND su.is_active = true
    AND EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_id AND o.restaurant_id = su.restaurant_id
    )
  )
);

CREATE POLICY "Sub users can create approval requests"
ON public.order_approval_requests
FOR INSERT
WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Approvers can update approval requests"
ON public.order_approval_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id AND o.restaurant_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.restaurant_sub_users su
    JOIN public.restaurant_sub_user_permissions p ON p.sub_user_id = su.id
    WHERE su.user_id = auth.uid() 
    AND su.is_active = true
    AND p.can_approve_order = true
    AND EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_id AND o.restaurant_id = su.restaurant_id
    )
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_restaurant_sub_users_updated_at
BEFORE UPDATE ON public.restaurant_sub_users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_restaurant_sub_user_permissions_updated_at
BEFORE UPDATE ON public.restaurant_sub_user_permissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_order_approval_requests_updated_at
BEFORE UPDATE ON public.order_approval_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for approval requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_approval_requests;