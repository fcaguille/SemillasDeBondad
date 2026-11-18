-- Modelo financiero único: activación de 16 MXN y 10 MXN directos al pozo.
ALTER TABLE public.pagos_mercadopago
  ALTER COLUMN monto_neto_pozo SET DEFAULT 10.00;

CREATE OR REPLACE FUNCTION public.registrar_pago_aprobado(
  p_mp_payment_id text, p_user_id uuid, p_no_cuenta text, p_monto numeric
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  IF p_monto < 16.00 THEN
    RAISE EXCEPTION 'El pago debe ser de al menos $16.00 MXN.';
  END IF;
  PERFORM 1 FROM public.perfiles
   WHERE user_id = p_user_id AND no_cuenta = p_no_cuenta FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'perfil_no_encontrado' USING errcode = 'P0002'; END IF;
  INSERT INTO public.pagos_mercadopago
    (mp_payment_id,user_id,no_cuenta,monto_bruto,monto_neto_pozo,estatus_mp,fecha_aprobacion)
  VALUES (p_mp_payment_id,p_user_id,p_no_cuenta,p_monto,10.00,'approved',now())
  ON CONFLICT (user_id) DO UPDATE SET
    mp_payment_id=EXCLUDED.mp_payment_id,
    no_cuenta=EXCLUDED.no_cuenta,
    monto_bruto=EXCLUDED.monto_bruto,
    monto_neto_pozo=10.00,
    estatus_mp='approved',
    fecha_aprobacion=now();
  UPDATE public.perfiles SET estatus_pago='ACTIVO',descalificado=false,motivo_descalificacion=NULL
   WHERE user_id=p_user_id;
  RETURN 'activado';
END;
$function$;
REVOKE ALL ON FUNCTION public.registrar_pago_aprobado(text,uuid,text,numeric) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_pago_aprobado(text,uuid,text,numeric) TO service_role;

DROP FUNCTION IF EXISTS public.mi_pago();
CREATE FUNCTION public.mi_pago()
RETURNS TABLE(
  id text,usuario_id uuid,folio text,aportacion_centavos integer,
  total_centavos integer,moneda text,estado text,pagado_en timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public
AS $function$
  SELECT p.mp_payment_id,p.user_id,'MP-'||p.mp_payment_id,1000,
    round(p.monto_bruto*100)::integer,'MXN',
    CASE WHEN p.estatus_mp='approved' THEN 'aprobado' ELSE 'pendiente' END,
    p.fecha_aprobacion
  FROM public.pagos_mercadopago p
  WHERE p.user_id=auth.uid()
  ORDER BY p.fecha_aprobacion DESC NULLS LAST LIMIT 1;
$function$;
REVOKE ALL ON FUNCTION public.mi_pago() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mi_pago() TO authenticated;

CREATE OR REPLACE FUNCTION public.calcular_reparto_premio()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $function$
DECLARE
  v_carrera integer; v_pozo numeric(14,2); v_centavos bigint;
  v_activos integer; v_carreras integer; v_n integer;
  v_sin_clabe integer; v_insertados integer;
BEGIN
  IF coalesce(auth.role(),'') <> 'service_role' THEN
    RAISE EXCEPTION 'Operación exclusiva del servicio.' USING errcode='42501';
  END IF;
  SELECT coalesce(sum(monto_neto_pozo),0) INTO v_pozo
    FROM public.pagos_mercadopago WHERE estatus_mp='approved';
  v_centavos:=round(v_pozo*100)::bigint;
  IF v_centavos<=0 THEN RAISE EXCEPTION 'El pozo acumulado está vacío.'; END IF;
  SELECT count(*),count(DISTINCT id_carrera) INTO v_activos,v_carreras
    FROM public.perfiles WHERE estatus_pago='ACTIVO' AND NOT descalificado;
  IF v_activos=0 THEN RAISE EXCEPTION 'No hay participantes elegibles.'; END IF;

  IF v_carreras<2 OR v_activos<20 THEN
    WITH validas AS (
      SELECT pl.id_planta,pl.puntaje_neto,pl.creado_en,
        row_number() OVER(ORDER BY pl.puntaje_neto DESC,pl.creado_en ASC,pl.id_planta ASC) lugar
      FROM public.plantas pl
      WHERE EXISTS(SELECT 1 FROM public.planta_creadores pc WHERE pc.id_planta=pl.id_planta)
        AND NOT EXISTS(
          SELECT 1 FROM public.planta_creadores pc JOIN public.perfiles pf USING(user_id)
          WHERE pc.id_planta=pl.id_planta AND (pf.estatus_pago<>'ACTIVO' OR pf.descalificado)
        )
    )
    SELECT count(*) INTO v_n FROM validas WHERE lugar<=3;
    IF v_n<3 THEN
      RAISE EXCEPTION 'La contingencia requiere tres macetas elegibles con participantes activos y sin sanciones.';
    END IF;

    WITH validas AS (
      SELECT pl.id_planta,pl.puntaje_neto,pl.creado_en,
        row_number() OVER(ORDER BY pl.puntaje_neto DESC,pl.creado_en ASC,pl.id_planta ASC) lugar
      FROM public.plantas pl
      WHERE EXISTS(SELECT 1 FROM public.planta_creadores pc WHERE pc.id_planta=pl.id_planta)
        AND NOT EXISTS(
          SELECT 1 FROM public.planta_creadores pc JOIN public.perfiles pf USING(user_id)
          WHERE pc.id_planta=pl.id_planta AND (pf.estatus_pago<>'ACTIVO' OR pf.descalificado)
        )
    ),
    podio AS (
      SELECT id_planta,lugar,
        CASE lugar WHEN 1 THEN round(v_centavos*0.50)::bigint
          WHEN 2 THEN round(v_centavos*0.30)::bigint
          ELSE v_centavos-round(v_centavos*0.50)::bigint-round(v_centavos*0.30)::bigint END centavos
      FROM validas WHERE lugar<=3
    ),
    miembros AS (
      SELECT po.lugar,po.centavos,pc.user_id,pf.id_carrera,
        count(*) OVER(PARTITION BY po.lugar) integrantes,
        row_number() OVER(PARTITION BY po.lugar ORDER BY pc.user_id) orden
      FROM podio po JOIN public.planta_creadores pc USING(id_planta)
      JOIN public.perfiles pf USING(user_id)
    ),
    reparto AS (
      SELECT user_id,id_carrera,
        centavos/integrantes+CASE WHEN orden<=mod(centavos,integrantes) THEN 1 ELSE 0 END centavos
      FROM miembros
    )
    SELECT count(*) INTO v_sin_clabe FROM public.perfiles pf
    WHERE pf.clabe_interbancaria IS NULL
      AND pf.user_id IN(SELECT DISTINCT user_id FROM reparto);
    IF v_sin_clabe>0 THEN
      RAISE EXCEPTION 'Faltan % CLABEs de integrantes elegibles del Top 3.',v_sin_clabe;
    END IF;

    WITH validas AS (
      SELECT pl.id_planta,pl.puntaje_neto,pl.creado_en,
        row_number() OVER(ORDER BY pl.puntaje_neto DESC,pl.creado_en ASC,pl.id_planta ASC) lugar
      FROM public.plantas pl
      WHERE EXISTS(SELECT 1 FROM public.planta_creadores pc WHERE pc.id_planta=pl.id_planta)
        AND NOT EXISTS(
          SELECT 1 FROM public.planta_creadores pc JOIN public.perfiles pf USING(user_id)
          WHERE pc.id_planta=pl.id_planta AND (pf.estatus_pago<>'ACTIVO' OR pf.descalificado)
        )
    ),
    podio AS (
      SELECT id_planta,lugar,
        CASE lugar WHEN 1 THEN round(v_centavos*0.50)::bigint
          WHEN 2 THEN round(v_centavos*0.30)::bigint
          ELSE v_centavos-round(v_centavos*0.50)::bigint-round(v_centavos*0.30)::bigint END centavos
      FROM validas WHERE lugar<=3
    ),
    miembros AS (
      SELECT po.lugar,po.centavos,pc.user_id,pf.id_carrera,
        count(*) OVER(PARTITION BY po.lugar) integrantes,
        row_number() OVER(PARTITION BY po.lugar ORDER BY pc.user_id) orden
      FROM podio po JOIN public.planta_creadores pc USING(id_planta)
      JOIN public.perfiles pf USING(user_id)
    ),
    reparto AS (
      SELECT user_id,id_carrera,
        centavos/integrantes+CASE WHEN orden<=mod(centavos,integrantes) THEN 1 ELSE 0 END centavos
      FROM miembros
    ),
    agregado AS (
      SELECT user_id,id_carrera,sum(centavos) centavos
      FROM reparto GROUP BY user_id,id_carrera
    )
    INSERT INTO public.dispersiones_premio(user_id,id_carrera,monto_asignado,clabe_destino)
    SELECT a.user_id,a.id_carrera,a.centavos/100.0,pf.clabe_interbancaria
    FROM agregado a JOIN public.perfiles pf USING(user_id)
    ON CONFLICT(user_id,id_carrera) DO NOTHING;
    GET DIAGNOSTICS v_insertados=ROW_COUNT;
    RETURN v_insertados;
  END IF;

  SELECT id_carrera INTO v_carrera FROM public.ranking_carreras
  ORDER BY indice_ecosustentable DESC,id_carrera ASC LIMIT 1;
  IF v_carrera IS NULL THEN RAISE EXCEPTION 'No hay carrera ganadora.'; END IF;
  SELECT count(*),count(*) FILTER(WHERE clabe_interbancaria IS NULL)
    INTO v_n,v_sin_clabe FROM public.perfiles
    WHERE id_carrera=v_carrera AND estatus_pago='ACTIVO' AND NOT descalificado;
  IF v_n=0 THEN RAISE EXCEPTION 'No hay participantes elegibles.'; END IF;
  IF v_sin_clabe>0 THEN
    RAISE EXCEPTION 'Faltan % CLABEs de participantes elegibles; no se generó el reparto.',v_sin_clabe;
  END IF;
  IF v_centavos%v_n<>0 THEN
    RAISE EXCEPTION 'El pozo no puede dividirse en partes idénticas a centavos entre % participantes.',v_n;
  END IF;
  INSERT INTO public.dispersiones_premio(user_id,id_carrera,monto_asignado,clabe_destino)
  SELECT user_id,v_carrera,v_centavos/v_n/100.0,clabe_interbancaria
  FROM public.perfiles WHERE id_carrera=v_carrera AND estatus_pago='ACTIVO' AND NOT descalificado
  ON CONFLICT(user_id,id_carrera) DO NOTHING;
  GET DIAGNOSTICS v_insertados=ROW_COUNT;
  RETURN v_insertados;
END;
$function$;
REVOKE ALL ON FUNCTION public.calcular_reparto_premio() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.calcular_reparto_premio() TO service_role;
