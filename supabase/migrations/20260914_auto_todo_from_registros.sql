alter table public.pendientes
add column if not exists origen_registro_id uuid
references public.registros(id)
on delete cascade;

create unique index if not exists
pendientes_origen_registro_id_uidx
on public.pendientes(origen_registro_id)
where origen_registro_id is not null;

create or replace function public.crear_pendiente_desde_registro()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  insert into public.pendientes (
    titulo,
    descripcion,
    dependencia_id,
    persona_id,
    prioridad,
    completado,
    origen_registro_id,
    origen_ingreso_id
  )
  values (
    coalesce(
      nullif(new.titulo, ''),
      'Información para revisar'
    ),
    new.contenido,
    new.dependencia_id,
    new.persona_id,
    'normal',
    false,
    new.id,
    new.origen_ingreso_id
  )
  on conflict do nothing;

  return new;

end;
$$;

drop trigger if exists
trg_registro_crea_pendiente
on public.registros;

create trigger
trg_registro_crea_pendiente
after insert
on public.registros
for each row
execute function
public.crear_pendiente_desde_registro();

insert into public.pendientes (
  titulo,
  descripcion,
  dependencia_id,
  persona_id,
  prioridad,
  completado,
  origen_registro_id,
  origen_ingreso_id
)
select
  coalesce(
    nullif(r.titulo, ''),
    'Información para revisar'
  ),
  r.contenido,
  r.dependencia_id,
  r.persona_id,
  'normal',
  false,
  r.id,
  r.origen_ingreso_id
from public.registros r
where not exists (
  select 1
  from public.pendientes p
  where
    p.origen_registro_id = r.id
);
