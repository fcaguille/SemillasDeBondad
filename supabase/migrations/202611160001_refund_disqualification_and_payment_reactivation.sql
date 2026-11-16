ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS motivo_descalificacion text;

CREATE OR REPLACE VIEW public.perfiles_publicos AS
SELECT user_id, nickname, id_carrera, avatar_url, bio, estatus_pago, descalificado, motivo_descalificacion
FROM public.perfiles;

CREATE OR REPLACE FUNCTION public.registrar_pago_aprobado(
  p_mp_payment_id text, p_user_id uuid, p_no_cuenta text, p_monto numeric
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_insertado text;
BEGIN
  PERFORM 1 FROM public.perfiles
  WHERE user_id = p_user_id AND no_cuenta = p_no_cuenta FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'perfil_no_encontrado' USING errcode = 'P0002';
  END IF;

  INSERT INTO public.pagos_mercadopago
    (mp_payment_id, user_id, no_cuenta, monto_bruto, monto_neto_pozo, estatus_mp, fecha_aprobacion)
  VALUES (p_mp_payment_id, p_user_id, p_no_cuenta, p_monto, 10.00, 'approved', now())
  ON CONFLICT (user_id) DO UPDATE SET
    mp_payment_id = EXCLUDED.mp_payment_id,
    no_cuenta = EXCLUDED.no_cuenta,
    monto_bruto = EXCLUDED.monto_bruto,
    monto_neto_pozo = EXCLUDED.monto_neto_pozo,
    estatus_mp = 'approved',
    fecha_aprobacion = now()
  RETURNING mp_payment_id INTO v_insertado;

  UPDATE public.perfiles SET estatus_pago = 'ACTIVO',
    descalificado = false, motivo_descalificacion = NULL
  WHERE user_id = p_user_id;
  RETURN 'activado';
END;
$function$;

REVOKE ALL ON FUNCTION public.registrar_pago_aprobado(text, uuid, text, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_pago_aprobado(text, uuid, text, numeric) TO service_role;
