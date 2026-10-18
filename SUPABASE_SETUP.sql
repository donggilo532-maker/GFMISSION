-- GFMISSION 독립 Supabase 프로젝트 전용. 기존 BCM 데이터베이스에서는 실행하지 마세요.
-- 프로젝트 개설 후 SQL Editor에서 실행. 이후 관리자 Auth 사용자 생성 및 church_admins 수동 등록.
create extension if not exists pgcrypto;
create table if not exists public.church_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.church_content (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('bulletin','sermon')),
  event_date date not null,
  title text not null check (char_length(title) between 1 and 200),
  issue text,
  summary text,
  image_url text,
  pdf_url text,
  video_url text,
  preacher text,
  scripture text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_church_content_public on public.church_content (published,event_date desc);
create or replace function public.touch_church_content_updated_at()
returns trigger language plpgsql set search_path='' as $$begin new.updated_at=now();return new;end;$$;
drop trigger if exists trg_church_content_updated_at on public.church_content;
create trigger trg_church_content_updated_at before update on public.church_content
for each row execute function public.touch_church_content_updated_at();

alter table public.church_admins enable row level security;
alter table public.church_content enable row level security;

-- SECURlTY DEFINER checks approved list without policy recursion; restrict function execution.
create or replace function public.is_church_admin()
returns boolean language sql stable security definer set search_path='' as $$
  select exists (select 1 from public.church_admins where user_id=auth.uid() and active=true);
$$;
revoke all on function public.is_church_admin() from public;
grant execute on function public.is_church_admin() to authenticated;

drop policy if exists admin_read_self on public.church_admins;
create policy admin_read_self on public.church_admins for select to authenticated
using (user_id=(select auth.uid()));

drop policy if exists public_read_published on public.church_content;
create policy public_read_published on public.church_content for select to anon,authenticated
using (published=true);
drop policy if exists admins_read_all on public.church_content;
create policy admins_read_all on public.church_content for select to authenticated
using ((select public.is_church_admin()));
drop policy if exists admins_insert on public.church_content;
create policy admins_insert on public.church_content for insert to authenticated
with check ((select public.is_church_admin()));
drop policy if exists admins_update on public.church_content;
create policy admins_update on public.church_content for update to authenticated
using ((select public.is_church_admin())) with check ((select public.is_church_admin()));
drop policy if exists admins_delete on public.church_content;
create policy admins_delete on public.church_content for delete to authenticated
using ((select public.is_church_admin()));

grant select on public.church_content to anon;
grant select,insert,update,delete on public.church_content to authenticated;
grant select on public.church_admins to authenticated;

-- Uploaded files are immediately public; upload only explicitly approved bulletin assets.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('church-assets','church-assets',true,10485760,ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public=excluded.public, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists church_admin_upload on storage.objects;
create policy church_admin_upload on storage.objects for insert to authenticated
with check (bucket_id='church-assets' and (select public.is_church_admin()));
drop policy if exists church_admin_update_file on storage.objects;
create policy church_admin_update_file on storage.objects for update to authenticated
using (bucket_id='church-assets' and (select public.is_church_admin()))
with check (bucket_id='church-assets' and (select public.is_church_admin()));
drop policy if exists church_admin_delete_file on storage.objects;
create policy church_admin_delete_file on storage.objects for delete to authenticated
using (bucket_id='church-assets' and (select public.is_church_admin()));

-- Optional: current verified bulletin catalog entry; upsert only once, without unverified PDF link.
-- insert into public.church_content(category,event_date,title,issue,summary,published)
-- values ('bulletin','2026-10-18','구원의 방주','2026-42','2026년 10월 18일 주보',true);

-- After inviting an editor in Authentication > Users, COPY THEIR UUID:
-- insert into public.church_admins (user_id,active) values ('사용자_UUID'::uuid,true);
