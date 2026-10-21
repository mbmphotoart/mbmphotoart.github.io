begin;
create schema if not exists portfolio_private;
revoke all on schema portfolio_private from public, anon;
grant usage on schema portfolio_private to authenticated;
create table if not exists public.portfolio_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  active boolean not null default true,
  joined_at timestamptz not null default now()
);
alter table public.portfolio_members enable row level security;
revoke all on public.portfolio_members from anon, authenticated;
grant select on public.portfolio_members to authenticated;
drop policy if exists member_reads_self on public.portfolio_members;
create policy member_reads_self on public.portfolio_members for select to authenticated using(user_id = (select auth.uid()));
create or replace function portfolio_private.portfolio_sync_member() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.portfolio_members(user_id,email) values(new.id,new.email)
  on conflict(user_id) do update set email=excluded.email;
  return new;
end $$;
revoke all on function portfolio_private.portfolio_sync_member() from public;
drop trigger if exists portfolio_member_created on auth.users;
create trigger portfolio_member_created after insert or update of email on auth.users
for each row when(new.email is not null) execute function portfolio_private.portfolio_sync_member();
insert into public.portfolio_members(user_id,email)
select id,email from auth.users where email is not null on conflict(user_id) do nothing;
create or replace function portfolio_private.portfolio_access_enabled() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.portfolio_members m join auth.users u on u.id=m.user_id
 where m.user_id=(select auth.uid()) and m.active and u.email_confirmed_at is not null
 and (u.banned_until is null or u.banned_until<now()));
$$;
revoke all on function portfolio_private.portfolio_access_enabled() from public,anon;
grant execute on function portfolio_private.portfolio_access_enabled() to authenticated;
insert into storage.buckets(id,name,public) values('portfolio-private','portfolio-private',false)
on conflict(id) do update set public=false;
drop policy if exists portfolio_verified_members on storage.objects;
create policy portfolio_verified_members on storage.objects for select to authenticated
using(bucket_id='portfolio-private' and (select portfolio_private.portfolio_access_enabled()));
-- No client write or delete policy. Only the migration/admin service may write.
commit;
