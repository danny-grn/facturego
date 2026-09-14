-- =============================================================================
-- FactureGO — schéma Supabase (PostgreSQL)
-- =============================================================================
-- À exécuter une seule fois dans l'éditeur SQL de votre projet Supabase
-- (Dashboard Supabase > SQL Editor > New query > coller ce fichier > Run).
--
-- Ce script est idempotent : vous pouvez le relancer sans risque, il ne
-- duplique rien (utilisation de IF NOT EXISTS / CREATE OR REPLACE / DROP ... IF EXISTS).
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. PROFILES — un profil entreprise par utilisateur (auth.users)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  company_name          text not null default '',
  legal_form            text,
  siret                 text,
  vat_number            text,
  address               text,
  postal_code           text,
  city                  text,
  country               text default 'France',
  phone                 text,
  email                 text,
  iban                  text,
  bic                   text,
  logo_data_url         text,
  invoice_prefix        text not null default 'FAC',
  next_invoice_seq      integer not null default 1,
  default_tax_rate      numeric not null default 20,
  default_payment_terms integer not null default 30,
  onboarded             boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 2. CLIENTS — carnet de clients de chaque utilisateur
-- -----------------------------------------------------------------------------
create table if not exists public.clients (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text not null,
  email        text,
  phone        text,
  address      text,
  postal_code  text,
  city         text,
  country      text default 'France',
  siret        text,
  vat_number   text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists clients_user_id_idx on public.clients (user_id);

-- -----------------------------------------------------------------------------
-- 3. INVOICES — factures
-- -----------------------------------------------------------------------------
create table if not exists public.invoices (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  client_id      uuid references public.clients (id) on delete set null,
  invoice_number text not null,
  status         text not null default 'draft'
                 check (status in ('draft','sent','viewed','signed','paid','overdue','cancelled')),
  issue_date     date not null default current_date,
  due_date       date,
  currency       text not null default 'EUR',
  notes          text,
  payment_terms  text,
  subtotal       numeric not null default 0,
  tax_total      numeric not null default 0,
  total          numeric not null default 0,
  share_token    uuid not null default gen_random_uuid(),
  sent_at        timestamptz,
  viewed_at      timestamptz,
  paid_at        timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, invoice_number),
  unique (share_token)
);

create index if not exists invoices_user_id_idx on public.invoices (user_id);
create index if not exists invoices_client_id_idx on public.invoices (client_id);
create index if not exists invoices_share_token_idx on public.invoices (share_token);
create index if not exists invoices_status_idx on public.invoices (status);

-- -----------------------------------------------------------------------------
-- 4. INVOICE_ITEMS — lignes de facture
-- -----------------------------------------------------------------------------
create table if not exists public.invoice_items (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references public.invoices (id) on delete cascade,
  description text not null default '',
  quantity    numeric not null default 1,
  unit_price  numeric not null default 0,
  tax_rate    numeric not null default 20,
  position    integer not null default 0
);

create index if not exists invoice_items_invoice_id_idx on public.invoice_items (invoice_id);

-- -----------------------------------------------------------------------------
-- 5. DOCUMENTS — documents génériques (devis, contrats...) à faire signer
-- -----------------------------------------------------------------------------
create table if not exists public.documents (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  client_id         uuid references public.clients (id) on delete set null,
  title             text not null,
  file_name         text not null,
  file_mime         text not null default 'application/pdf',
  file_data_base64  text not null,
  status            text not null default 'draft'
                    check (status in ('draft','sent','viewed','signed','cancelled')),
  share_token       uuid not null default gen_random_uuid(),
  sent_at           timestamptz,
  viewed_at         timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (share_token)
);

create index if not exists documents_user_id_idx on public.documents (user_id);
create index if not exists documents_share_token_idx on public.documents (share_token);

-- -----------------------------------------------------------------------------
-- 6. SIGNATURES — signatures électroniques (facture OU document)
-- -----------------------------------------------------------------------------
create table if not exists public.signatures (
  id                 uuid primary key default gen_random_uuid(),
  invoice_id         uuid references public.invoices (id) on delete cascade,
  document_id        uuid references public.documents (id) on delete cascade,
  signer_name        text not null,
  signer_email       text,
  signature_data_url text not null,
  signature_hash     text not null,
  ip_address         text,
  user_agent         text,
  signed_at          timestamptz not null default now(),
  constraint signatures_target_check check (
    (invoice_id is not null and document_id is null) or
    (invoice_id is null and document_id is not null)
  )
);

create index if not exists signatures_invoice_id_idx on public.signatures (invoice_id);
create index if not exists signatures_document_id_idx on public.signatures (document_id);

-- -----------------------------------------------------------------------------
-- 7. ACTIVITY_LOG — piste d'audit (facture OU document)
-- -----------------------------------------------------------------------------
create table if not exists public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid references public.invoices (id) on delete cascade,
  document_id uuid references public.documents (id) on delete cascade,
  event_type  text not null,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  constraint activity_log_target_check check (
    (invoice_id is not null and document_id is null) or
    (invoice_id is null and document_id is not null)
  )
);

create index if not exists activity_log_invoice_id_idx on public.activity_log (invoice_id);
create index if not exists activity_log_document_id_idx on public.activity_log (document_id);

-- =============================================================================
-- TRIGGERS — updated_at automatique
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.clients;
create trigger set_updated_at before update on public.clients
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.invoices;
create trigger set_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.documents;
create trigger set_updated_at before update on public.documents
  for each row execute function public.set_updated_at();

-- =============================================================================
-- TRIGGER — création automatique du profil à l'inscription
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, company_name)
  values (new.id, new.email, '')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Rattrapage : crée le profil manquant des comptes inscrits avant la pose du
-- trigger (sans profil, la numérotation des factures renvoie NULL).
insert into public.profiles (id, email, company_name)
select u.id, u.email, ''
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- =============================================================================
-- RLS — activation
-- =============================================================================
alter table public.profiles      enable row level security;
alter table public.clients       enable row level security;
alter table public.invoices      enable row level security;
alter table public.invoice_items enable row level security;
alter table public.documents     enable row level security;
alter table public.signatures    enable row level security;
alter table public.activity_log  enable row level security;

-- PROFILES : chacun ne voit / modifie que son propre profil
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- CLIENTS : CRUD limité au propriétaire
drop policy if exists "clients_all_own" on public.clients;
create policy "clients_all_own" on public.clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- INVOICES : CRUD limité au propriétaire
drop policy if exists "invoices_all_own" on public.invoices;
create policy "invoices_all_own" on public.invoices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- INVOICE_ITEMS : accès via la facture parente
drop policy if exists "invoice_items_all_own" on public.invoice_items;
create policy "invoice_items_all_own" on public.invoice_items
  for all using (
    exists (select 1 from public.invoices i where i.id = invoice_items.invoice_id and i.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.invoices i where i.id = invoice_items.invoice_id and i.user_id = auth.uid())
  );

-- DOCUMENTS : CRUD limité au propriétaire
drop policy if exists "documents_all_own" on public.documents;
create policy "documents_all_own" on public.documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- SIGNATURES : lecture par le propriétaire de la facture/document concerné
-- (l'écriture publique passe exclusivement par la fonction submit_signature_by_token ci-dessous,
-- exécutée en SECURITY DEFINER — aucune policy INSERT n'est nécessaire ni ouverte ici)
drop policy if exists "signatures_select_own" on public.signatures;
create policy "signatures_select_own" on public.signatures
  for select using (
    exists (select 1 from public.invoices i where i.id = signatures.invoice_id and i.user_id = auth.uid())
    or exists (select 1 from public.documents d where d.id = signatures.document_id and d.user_id = auth.uid())
  );

-- ACTIVITY_LOG : lecture par le propriétaire de la facture/document concerné
drop policy if exists "activity_log_select_own" on public.activity_log;
create policy "activity_log_select_own" on public.activity_log
  for select using (
    exists (select 1 from public.invoices i where i.id = activity_log.invoice_id and i.user_id = auth.uid())
    or exists (select 1 from public.documents d where d.id = activity_log.document_id and d.user_id = auth.uid())
  );

-- =============================================================================
-- RPC — numérotation atomique des factures
-- =============================================================================
create or replace function public.next_invoice_number(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text;
  v_seq    integer;
  v_year   text := to_char(current_date, 'YYYY');
begin
  if p_user_id <> auth.uid() then
    raise exception 'forbidden';
  end if;

  -- Filet de sécurité : sans ligne profiles, l'UPDATE ci-dessous ne renvoie
  -- rien et la fonction retournerait NULL.
  insert into public.profiles (id, email)
  select p_user_id, u.email from auth.users u where u.id = p_user_id
  on conflict (id) do nothing;

  update public.profiles
  set next_invoice_seq = next_invoice_seq + 1
  where id = p_user_id
  returning invoice_prefix, next_invoice_seq - 1 into v_prefix, v_seq;

  if v_prefix is null then
    v_prefix := 'FAC';
  end if;

  return v_prefix || '-' || v_year || '-' || lpad(v_seq::text, 4, '0');
end;
$$;

grant execute on function public.next_invoice_number(uuid) to authenticated;

-- =============================================================================
-- RPC — journal d'activité (facture) depuis le client authentifié
-- =============================================================================
create or replace function public.log_invoice_activity(p_invoice_id uuid, p_event_type text, p_metadata jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.invoices where id = p_invoice_id and user_id = auth.uid()) then
    raise exception 'forbidden';
  end if;
  insert into public.activity_log (invoice_id, event_type, metadata)
  values (p_invoice_id, p_event_type, p_metadata);
end;
$$;

grant execute on function public.log_invoice_activity(uuid, text, jsonb) to authenticated;

create or replace function public.log_document_activity(p_document_id uuid, p_event_type text, p_metadata jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.documents where id = p_document_id and user_id = auth.uid()) then
    raise exception 'forbidden';
  end if;
  insert into public.activity_log (document_id, event_type, metadata)
  values (p_document_id, p_event_type, p_metadata);
end;
$$;

grant execute on function public.log_document_activity(uuid, text, jsonb) to authenticated;

-- =============================================================================
-- RPC — accès PUBLIC (anonyme) via jeton de partage, pour la signature en ligne
-- =============================================================================
-- Renvoie la facture ou le document correspondant au jeton, sans exposer les
-- autres lignes de la table (aucune policy SELECT publique n'est créée : tout
-- passe par ces fonctions SECURITY DEFINER, seule porte d'entrée anonyme).
create or replace function public.get_signable_by_token(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
  v_invoice public.invoices%rowtype;
  v_document public.documents%rowtype;
begin
  select * into v_invoice from public.invoices where share_token = p_token;
  if found then
    if v_invoice.status = 'sent' then
      update public.invoices set status = 'viewed', viewed_at = now() where id = v_invoice.id
        returning * into v_invoice;
      insert into public.activity_log (invoice_id, event_type) values (v_invoice.id, 'viewed');
    end if;

    select jsonb_build_object(
      'kind', 'invoice',
      'invoice', to_jsonb(v_invoice) - 'user_id' - 'share_token',
      'items', coalesce((select jsonb_agg(to_jsonb(it) - 'invoice_id' order by it.position)
                          from public.invoice_items it where it.invoice_id = v_invoice.id), '[]'::jsonb),
      'client', (select to_jsonb(c) - 'user_id' from public.clients c where c.id = v_invoice.client_id),
      'profile', (select to_jsonb(p) - 'next_invoice_seq' from public.profiles p where p.id = v_invoice.user_id),
      'signature', (select to_jsonb(s) from public.signatures s where s.invoice_id = v_invoice.id limit 1)
    ) into v_result;
    return v_result;
  end if;

  select * into v_document from public.documents where share_token = p_token;
  if found then
    if v_document.status = 'sent' then
      update public.documents set status = 'viewed', viewed_at = now() where id = v_document.id
        returning * into v_document;
      insert into public.activity_log (document_id, event_type) values (v_document.id, 'viewed');
    end if;

    select jsonb_build_object(
      'kind', 'document',
      'document', to_jsonb(v_document) - 'user_id' - 'share_token',
      'client', (select to_jsonb(c) - 'user_id' from public.clients c where c.id = v_document.client_id),
      'profile', (select to_jsonb(p) - 'next_invoice_seq' from public.profiles p where p.id = v_document.user_id),
      'signature', (select to_jsonb(s) from public.signatures s where s.document_id = v_document.id limit 1)
    ) into v_result;
    return v_result;
  end if;

  return null;
end;
$$;

grant execute on function public.get_signable_by_token(uuid) to anon, authenticated;

create or replace function public.submit_signature_by_token(
  p_token uuid,
  p_signer_name text,
  p_signer_email text,
  p_signature_data_url text,
  p_signature_hash text,
  p_ip_address text default null,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice public.invoices%rowtype;
  v_document public.documents%rowtype;
begin
  if p_signer_name is null or length(trim(p_signer_name)) = 0 then
    raise exception 'signer_name_required';
  end if;
  if p_signature_data_url is null or length(p_signature_data_url) = 0 then
    raise exception 'signature_required';
  end if;

  select * into v_invoice from public.invoices where share_token = p_token;
  if found then
    if v_invoice.status = 'signed' or v_invoice.status = 'paid' then
      raise exception 'already_signed';
    end if;
    if v_invoice.status = 'cancelled' then
      raise exception 'cancelled';
    end if;

    insert into public.signatures (invoice_id, signer_name, signer_email, signature_data_url, signature_hash, ip_address, user_agent)
    values (v_invoice.id, p_signer_name, p_signer_email, p_signature_data_url, p_signature_hash, p_ip_address, p_user_agent);

    update public.invoices set status = 'signed' where id = v_invoice.id;

    insert into public.activity_log (invoice_id, event_type, metadata)
    values (v_invoice.id, 'signed', jsonb_build_object('signer_name', p_signer_name, 'signer_email', p_signer_email));

    return jsonb_build_object('kind', 'invoice', 'id', v_invoice.id);
  end if;

  select * into v_document from public.documents where share_token = p_token;
  if found then
    if v_document.status = 'signed' then
      raise exception 'already_signed';
    end if;
    if v_document.status = 'cancelled' then
      raise exception 'cancelled';
    end if;

    insert into public.signatures (document_id, signer_name, signer_email, signature_data_url, signature_hash, ip_address, user_agent)
    values (v_document.id, p_signer_name, p_signer_email, p_signature_data_url, p_signature_hash, p_ip_address, p_user_agent);

    update public.documents set status = 'signed' where id = v_document.id;

    insert into public.activity_log (document_id, event_type, metadata)
    values (v_document.id, 'signed', jsonb_build_object('signer_name', p_signer_name, 'signer_email', p_signer_email));

    return jsonb_build_object('kind', 'document', 'id', v_document.id);
  end if;

  raise exception 'not_found';
end;
$$;

grant execute on function public.submit_signature_by_token(uuid, text, text, text, text, text, text) to anon, authenticated;

-- =============================================================================
-- RPC — ESPACE CLIENT
-- =============================================================================
-- Un destinataire qui se crée un compte avec l'adresse figurant sur sa fiche
-- client retrouve ici tout ce qui lui a été adressé. Le rapprochement se fait
-- sur l'email (insensible à la casse) : aucune colonne de liaison à maintenir.
-- Comme pour la signature publique, tout passe par cette fonction
-- SECURITY DEFINER — aucune policy supplémentaire n'est ouverte sur les tables.
create or replace function public.get_client_portal()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
begin
  if v_email = '' then
    return jsonb_build_object('email', null, 'invoices', '[]'::jsonb, 'documents', '[]'::jsonb);
  end if;

  return jsonb_build_object(
    'email', v_email,
    'invoices', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',             i.id,
        'invoice_number', i.invoice_number,
        'status',         i.status,
        'issue_date',     i.issue_date,
        'due_date',       i.due_date,
        'currency',       i.currency,
        'total',          i.total,
        'share_token',    i.share_token,
        'issuer',         coalesce(nullif(p.company_name, ''), 'Émetteur')
      ) order by i.issue_date desc, i.created_at desc)
      from public.invoices i
      join public.clients c on c.id = i.client_id
      left join public.profiles p on p.id = i.user_id
      where lower(trim(c.email)) = v_email
        and i.status not in ('draft', 'cancelled')
    ), '[]'::jsonb),
    'documents', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',          d.id,
        'title',       d.title,
        'status',      d.status,
        'created_at',  d.created_at,
        'share_token', d.share_token,
        'issuer',      coalesce(nullif(p.company_name, ''), 'Émetteur')
      ) order by d.created_at desc)
      from public.documents d
      join public.clients c on c.id = d.client_id
      left join public.profiles p on p.id = d.user_id
      where lower(trim(c.email)) = v_email
        and d.status not in ('draft', 'cancelled')
    ), '[]'::jsonb)
  );
end;
$$;

grant execute on function public.get_client_portal() to authenticated;

-- Indique à l'émetteur si le destinataire d'une fiche client pourra
-- effectivement retrouver ses documents dans l'espace client.
-- L'appelant ne peut interroger que ses propres fiches : impossible de tester
-- l'existence d'un compte pour une adresse arbitraire.
create or replace function public.client_portal_access(p_client_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  select lower(trim(coalesce(email, ''))) into v_email
  from public.clients
  where id = p_client_id and user_id = auth.uid();

  if not found then
    raise exception 'forbidden';
  end if;

  if v_email = '' then
    return jsonb_build_object('email', null, 'has_account', false);
  end if;

  return jsonb_build_object(
    'email', v_email,
    'has_account', exists (select 1 from auth.users u where lower(trim(u.email)) = v_email)
  );
end;
$$;

grant execute on function public.client_portal_access(uuid) to authenticated;

-- Le rapprochement se fait par email : sans index, chaque ouverture de l'espace
-- balaie la table clients.
-- L'index précédent portait sur lower(email) : « if not exists » ne l'aurait
-- pas redéfini, on le remplace explicitement.
drop index if exists clients_email_lower_idx;
create index if not exists clients_email_match_idx on public.clients (lower(trim(email)));

-- =============================================================================
-- Fin du script.
-- =============================================================================
