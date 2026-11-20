ALTER TABLE public.services ADD COLUMN category text NOT NULL DEFAULT 'OTT', ADD COLUMN description text NOT NULL DEFAULT '', ADD COLUMN features text[] NOT NULL DEFAULT '{}';
CREATE TABLE public.reviews (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id), order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id), rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5), comment text NOT NULL CHECK (char_length(comment) BETWEEN 3 AND 2000), display_name text NOT NULL DEFAULT 'Customer', approved boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;
GRANT UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read published or own reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (approved OR user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "review own fulfilled order" ON public.reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND NOT approved AND EXISTS(SELECT 1 FROM public.orders o WHERE o.id=order_id AND o.user_id=auth.uid() AND o.status IN ('active','expired')));
CREATE POLICY "admin moderate reviews" ON public.reviews FOR UPDATE TO authenticated USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin remove reviews" ON public.reviews FOR DELETE TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.submit_cart(_plan_ids uuid[], _utr text) RETURNS SETOF uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_plan uuid; v_order uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to submit an order'; END IF;
 IF EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND blocked) THEN RAISE EXCEPTION 'Account blocked'; END IF;
 IF cardinality(_plan_ids) IS NULL OR cardinality(_plan_ids)<1 THEN RAISE EXCEPTION 'Cart is empty'; END IF;
 IF char_length(trim(_utr))<6 THEN RAISE EXCEPTION 'Enter a valid transaction reference'; END IF;
 IF EXISTS(SELECT 1 FROM unnest(_plan_ids) id LEFT JOIN public.plans p ON p.id=id LEFT JOIN public.services s ON s.id=p.service_id WHERE p.id IS NULL OR NOT p.active OR NOT s.active) THEN RAISE EXCEPTION 'A selected plan is unavailable'; END IF;
 FOREACH v_plan IN ARRAY _plan_ids LOOP
 INSERT INTO public.orders(user_id,plan_id,amount,utr) VALUES(auth.uid(),v_plan,0,trim(_utr)) RETURNING id INTO v_order;
 RETURN NEXT v_order;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.submit_cart(uuid[],text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_cart(uuid[],text) TO authenticated;
