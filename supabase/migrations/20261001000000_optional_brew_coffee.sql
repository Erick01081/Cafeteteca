-- Permite conservar preparaciones independientes del catálogo de cafés.
alter table public."PREPARACIONES"
  alter column coffee_id drop not null;

alter table public."PREPARACIONES"
  drop constraint if exists preparaciones_coffee_id_fkey;

alter table public."PREPARACIONES"
  add constraint preparaciones_coffee_id_fkey
  foreign key (coffee_id) references public."CAFES" (id) on delete set null;

notify pgrst, 'reload schema';
