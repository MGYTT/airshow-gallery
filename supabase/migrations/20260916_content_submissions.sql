-- Publiczne zgłoszenia informacji: bez kont użytkowników i bez automatycznej publikacji.
create table if not exists public.content_submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('event_proposal', 'correction')),
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'accepted', 'rejected')),
  event_id uuid null references public.airshow_events(id) on delete set null,
  show_id text null references public.air_shows(id) on delete set null,
  page_url text not null default '',
  title text not null default '',
  message text not null,
  source_url text not null default '',
  contact_email text null,
  admin_note text null,
  created_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz null,
  reviewed_by text null
);

create index if not exists content_submissions_status_created_idx
  on public.content_submissions(status, created_at desc);

create index if not exists content_submissions_event_idx
  on public.content_submissions(event_id);

alter table public.content_submissions enable row level security;

drop policy if exists "Public can submit content suggestions" on public.content_submissions;
create policy "Public can submit content suggestions"
  on public.content_submissions
  for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and length(message) between 10 and 5000
    and length(page_url) <= 2048
    and length(title) <= 180
    and length(source_url) <= 2048
    and (contact_email is null or length(contact_email) <= 320)
  );

drop policy if exists "Service role manages content submissions" on public.content_submissions;
create policy "Service role manages content submissions"
  on public.content_submissions
  for all
  to service_role
  using (true)
  with check (true);

-- Publiczny użytkownik nie może czytać, aktualizować ani usuwać zgłoszeń.
