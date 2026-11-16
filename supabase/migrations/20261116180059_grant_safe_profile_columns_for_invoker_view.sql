GRANT SELECT (user_id, nickname, id_carrera, avatar_url, bio, estatus_pago, descalificado, motivo_descalificacion)
ON public.perfiles TO anon, authenticated;
