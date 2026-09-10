-- Crea l'enum
create type collection_type as enum ('CARTE', 'CHIBI');

-- Tabella collezioni (Pokemon, Yu-gi-oh, ecc.)
create table collections (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type collection_type not null default 'CARTE',
  created_at timestamptz not null default now()
);

-- Tabella carte/figurine
create table cards (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references collections(id) on delete cascade,
  quantity integer not null default 1 check (quantity >= 0),
  created_at timestamptz not null default now()
);

-- Indice per velocizzare le query "dammi tutte le carte di questa collezione"
create index idx_cards_collection_id on cards(collection_id);


-- RLS per Angular

alter table collections enable row level security;
alter table cards enable row level security;

-- Uso personale: accesso completo con anon key
create policy "Allow all on collections" on collections
  for all using (true) with check (true);

create policy "Allow all on cards" on cards
  for all using (true) with check (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cards TO anon;