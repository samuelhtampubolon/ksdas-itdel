-- KSDAS: skema Supabase (jalankan di Dashboard > SQL Editor). Aman diulang (idempoten).
-- Prinsip: semua tabel TERTUTUP (RLS aktif). Hanya pengguna yang surelnya ada di ksdas_staff yang boleh membaca/menulis.
-- Dengan begitu, walau pendaftaran terbuka atau kunci anon diketahui orang, data tetap tidak dapat diakses.

create table if not exists public.ksdas_staff (email text primary key);
create table if not exists public.ksdas_state (id text primary key, saved_at text, body text not null);
create table if not exists public.ksdas_audit (id bigint generated always as identity primary key, at text not null, actor text, action text, target text, detail text);
create table if not exists public.ksdas_backups (name text primary key, at text not null, bytes bigint, sha256 text, documents int, partners int, body text not null);
create table if not exists public.ksdas_files (doc_id text primary key, name text, type text, size bigint, sha256 text, at text, ext text, path text);
create table if not exists public.ksdas_sim (i int, payload text);
create index if not exists ksdas_audit_at on public.ksdas_audit (at);

create or replace function public.ksdas_is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ksdas_staff s where lower(s.email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
revoke all on function public.ksdas_is_staff() from public;
grant execute on function public.ksdas_is_staff() to authenticated;

alter table public.ksdas_staff enable row level security;   -- tanpa kebijakan: hanya dapat diubah lewat Dashboard / service role
do $$
declare t text;
begin
  foreach t in array array['ksdas_state','ksdas_audit','ksdas_backups','ksdas_files','ksdas_sim'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists ksdas_staff_all on public.%I', t);
    execute format('create policy ksdas_staff_all on public.%I for all to authenticated using (public.ksdas_is_staff()) with check (public.ksdas_is_staff())', t);
  end loop;
end $$;

-- Bucket privat untuk berkas asli (maks 25 MB per berkas; batas global paket Free 50 MB)
insert into storage.buckets (id, name, public, file_size_limit)
values ('ksdas-files', 'ksdas-files', false, 26214400)
on conflict (id) do update set public = false, file_size_limit = 26214400;

drop policy if exists ksdas_files_staff on storage.objects;
create policy ksdas_files_staff on storage.objects for all to authenticated
  using (bucket_id = 'ksdas-files' and public.ksdas_is_staff())
  with check (bucket_id = 'ksdas-files' and public.ksdas_is_staff());

-- LANGKAH MANUAL setelah menjalankan berkas ini:
--  1. Authentication > Providers > Email: nonaktifkan "Allow new users to sign up" (pengguna dibuat pemilik lewat Dashboard).
--  2. Authentication > Users > Add user: buat akun staf.
--  3. Daftarkan surel staf:  insert into public.ksdas_staff (email) values ('nama@del.ac.id');
