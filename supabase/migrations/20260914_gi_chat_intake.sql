create sequence if not exists public.gi_codigo_seq start 1;

create or replace function public.gi_guardar_entrada(
  p_texto text,
  p_titulo text default null,
  p_tipo_registro text default 'Observación',
  p_dependencia_nombre text default null,
  p_fecha date default null,
  p_hora time default null,
  p_lugar text default null,
  p_responsable text default null,
  p_prioridad text default 'normal',
  p_crear_evento boolean default false,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ingreso_id uuid;
  v_registro_id uuid;
  v_pendiente_id uuid;
  v_evento_id uuid;
  v_dependencia_id uuid;

  v_codigo text;
  v_titulo text;
  v_prioridad text;
begin

  if p_texto is null or btrim(p_texto) = '' then
    raise exception 'El texto de la entrada GI no puede estar vacío';
  end if;

  v_titulo :=
    coalesce(
      nullif(btrim(p_titulo), ''),
      'Información para revisar'
    );

  v_prioridad :=
    case lower(
      coalesce(
        nullif(btrim(p_prioridad), ''),
        'normal'
      )
    )
      when 'urgente' then 'urgente'
      when 'alta' then 'alta'
      when 'baja' then 'baja'
      else 'normal'
    end;

  -- Buscar dependencia si fue mencionada

  if
    p_dependencia_nombre is not null
    and btrim(p_dependencia_nombre) <> ''
  then

    select d.id
    into v_dependencia_id
    from public.dependencias d
    where
      lower(btrim(d.nombre)) =
      lower(btrim(p_dependencia_nombre))
    limit 1;

  end if;

  -- Código GI correlativo

  v_codigo :=
    'GI-' ||
    lpad(
      nextval(
        'public.gi_codigo_seq'
      )::text,
      4,
      '0'
    );

  -- Entrada original

  insert into public.ingresos (
    tipo_fuente,
    titulo,
    contenido_original,
    resumen,
    dependencia_id,
    estado,
    metadata
  )
  values (
    'chat_gi',
    v_titulo,
    p_texto,
    left(p_texto, 800),
    v_dependencia_id,
    'procesado',

    coalesce(
      p_metadata,
      '{}'::jsonb
    )
    ||
    jsonb_build_object(
      'codigo_gi',
      v_codigo,
      'canal',
      'chat_gi',
      'dependencia_mencionada',
      p_dependencia_nombre,
      'fecha_detectada',
      p_fecha,
      'hora_detectada',
      p_hora,
      'crear_evento',
      p_crear_evento
    )
  )
  returning id
  into v_ingreso_id;

  -- Registro institucional

  insert into public.registros (
    titulo,
    contenido,
    tipo,
    dependencia_id,
    origen_ingreso_id
  )
  values (
    v_titulo,
    p_texto,
    coalesce(
      nullif(
        btrim(p_tipo_registro),
        ''
      ),
      'Observación'
    ),
    v_dependencia_id,
    v_ingreso_id
  )
  returning id
  into v_registro_id;

  /*
    El trigger existente de registros
    crea automáticamente el pendiente.
  */

  select p.id
  into v_pendiente_id
  from public.pendientes p
  where
    p.origen_registro_id =
    v_registro_id
  limit 1;

  -- Ajustar prioridad y fecha detectadas

  if v_pendiente_id is not null then

    update public.pendientes
    set
      prioridad = v_prioridad,
      fecha_limite =
        coalesce(
          p_fecha,
          fecha_limite
        ),
      updated_at = now()
    where
      id = v_pendiente_id;

  end if;

  -- Historial de acción Registro

  insert into public.acciones_ingreso (
    ingreso_id,
    tipo_accion,
    entidad,
    entidad_id,
    titulo,
    resumen,
    datos,
    confianza,
    requiere_revision,
    estado
  )
  values (
    v_ingreso_id,
    'crear',
    'registros',
    v_registro_id,
    v_titulo,
    left(p_texto, 300),

    jsonb_build_object(
      'codigo_gi',
      v_codigo
    ),

    1.0,
    false,
    'aplicada'
  );

  -- Historial de acción Pendiente

  if v_pendiente_id is not null then

    insert into public.acciones_ingreso (
      ingreso_id,
      tipo_accion,
      entidad,
      entidad_id,
      titulo,
      resumen,
      datos,
      confianza,
      requiere_revision,
      estado
    )
    values (
      v_ingreso_id,
      'crear',
      'pendientes',
      v_pendiente_id,
      v_titulo,
      left(p_texto, 300),

      jsonb_build_object(
        'codigo_gi',
        v_codigo,
        'prioridad',
        v_prioridad,
        'fecha_limite',
        p_fecha
      ),

      1.0,
      false,
      'aplicada'
    );

  end if;

  /*
    Si el mensaje describe una actividad
    con fecha, también crear Agenda.
  */

  if
    p_crear_evento
    and p_fecha is not null
  then

    insert into public.eventos (
      nombre,
      fecha,
      hora,
      lugar,
      dependencia_id,
      responsable,
      descripcion,
      estado,
      fuente,
      origen_ingreso_id
    )
    values (
      v_titulo,
      p_fecha,
      p_hora,
      p_lugar,
      v_dependencia_id,
      p_responsable,
      p_texto,
      'pendiente',
      'chat_gi',
      v_ingreso_id
    )
    returning id
    into v_evento_id;

    insert into public.acciones_ingreso (
      ingreso_id,
      tipo_accion,
      entidad,
      entidad_id,
      titulo,
      resumen,
      datos,
      confianza,
      requiere_revision,
      estado
    )
    values (
      v_ingreso_id,
      'crear',
      'eventos',
      v_evento_id,
      v_titulo,
      left(p_texto, 300),

      jsonb_build_object(
        'codigo_gi',
        v_codigo,
        'fecha',
        p_fecha,
        'hora',
        p_hora,
        'lugar',
        p_lugar
      ),

      1.0,
      false,
      'aplicada'
    );

  end if;

  return jsonb_build_object(
    'ok',
    true,
    'codigo_gi',
    v_codigo,
    'ingreso_id',
    v_ingreso_id,
    'registro_id',
    v_registro_id,
    'pendiente_id',
    v_pendiente_id,
    'evento_id',
    v_evento_id,
    'dependencia_id',
    v_dependencia_id
  );

end;
$$;

revoke all
on function public.gi_guardar_entrada(
  text,
  text,
  text,
  text,
  date,
  time,
  text,
  text,
  text,
  boolean,
  jsonb
)
from public;

revoke all
on function public.gi_guardar_entrada(
  text,
  text,
  text,
  text,
  date,
  time,
  text,
  text,
  text,
  boolean,
  jsonb
)
from anon;

grant execute
on function public.gi_guardar_entrada(
  text,
  text,
  text,
  text,
  date,
  time,
  text,
  text,
  text,
  boolean,
  jsonb
)
to authenticated;

grant execute
on function public.gi_guardar_entrada(
  text,
  text,
  text,
  text,
  date,
  time,
  text,
  text,
  text,
  boolean,
  jsonb
)
to service_role;
