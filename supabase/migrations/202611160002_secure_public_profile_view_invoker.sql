CREATE OR REPLACE VIEW public.perfiles_publicos WITH (security_invoker = true) AS
SELECT user_id, nickname, id_carrera, avatar_url, bio, estatus_pago, descalificado, motivo_descalificacion
FROM public.perfiles;
