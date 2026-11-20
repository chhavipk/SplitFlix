CREATE OR REPLACE FUNCTION public.submit_cart(_plan_ids uuid[], _utr text) RETURNS SETOF uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_plan uuid; v_order uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to submit an order'; END IF;
 IF EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND blocked) THEN RAISE EXCEPTION 'Account blocked'; END IF;
 IF cardinality(_plan_ids) IS NULL OR cardinality(_plan_ids)<1 THEN RAISE EXCEPTION 'Cart is empty'; END IF;
 IF char_length(trim(_utr))<6 THEN RAISE EXCEPTION 'Enter a valid transaction reference'; END IF;
 IF EXISTS(SELECT 1 FROM unnest(_plan_ids) AS selected(plan_id) LEFT JOIN public.plans p ON p.id=selected.plan_id LEFT JOIN public.services s ON s.id=p.service_id WHERE p.id IS NULL OR NOT p.active OR NOT s.active) THEN RAISE EXCEPTION 'A selected plan is unavailable'; END IF;
 FOREACH v_plan IN ARRAY _plan_ids LOOP
 INSERT INTO public.orders(user_id,plan_id,amount,utr) VALUES(auth.uid(),v_plan,0,trim(_utr)) RETURNING id INTO v_order;
 RETURN NEXT v_order;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.submit_cart(uuid[],text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_cart(uuid[],text) TO authenticated;