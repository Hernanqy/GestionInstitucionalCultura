alter table public.eventos
  add column if not exists es_evento_gestion boolean not null default false,
  add column if not exists evento_padre_id uuid null references public.eventos(id) on delete cascade;

create index if not exists idx_eventos_es_evento_gestion
  on public.eventos(es_evento_gestion);

create index if not exists idx_eventos_evento_padre_id
  on public.eventos(evento_padre_id);

update public.eventos e
set es_evento_gestion = true
where exists (select 1 from public.evento_items i where i.evento_id = e.id)
   or lower(coalesce(e.fuente,'')) like '%ficha eventos subsecretaria%'
   or e.fuente = 'excel_subsecretaria_2026';