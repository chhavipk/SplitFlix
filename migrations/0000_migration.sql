create type public.app_role as enum ('admin','user');
create type public.order_status as enum ('pending','active','rejected','expired');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, email text, phone text,
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null, tagline text not null default '',
  hue int not null default 20,
  sort int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.services to anon, authenticated;
grant insert, update, delete on public.services to authenticated;
grant all on public.services to service_role;
alter table public.services enable row level security;
create policy "public read services" on public.services for select to anon, authenticated using (active or public.has_role(auth.uid(),'admin'));
create policy "admin write services" on public.services for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  name text not null, months int not null default 1,
  price int not null, mrp int,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.plans to anon, authenticated;
grant insert, update, delete on public.plans to authenticated;
grant all on public.plans to service_role;
alter table public.plans enable row level security;
create policy "public read plans" on public.plans for select to anon, authenticated using (active or public.has_role(auth.uid(),'admin'));
create policy "admin write plans" on public.plans for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.master_accounts (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  login_email text not null, login_password text not null,
  notes text not null default '',
  max_slots int not null default 4,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.master_accounts to authenticated;
grant all on public.master_accounts to service_role;
alter table public.master_accounts enable row level security;
create policy "admin all accounts" on public.master_accounts for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plan_id uuid not null references public.plans(id),
  amount int not null,
  utr text not null,
  status order_status not null default 'pending',
  account_id uuid references public.master_accounts(id) on delete set null,
  profile_label text,
  admin_note text,
  starts_at timestamptz, expires_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "own orders read" on public.orders for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own orders insert" on public.orders for insert to authenticated with check (user_id = auth.uid() and status = 'pending' and account_id is null
  and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.blocked));
create policy "admin orders update" on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin orders delete" on public.orders for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- price set server-side from plan
create or replace function public.set_order_amount() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op = 'INSERT' then
    select price into new.amount from public.plans where id = new.plan_id;
  end if;
  return new;
end $$;
create trigger orders_amount before insert on public.orders for each row execute function public.set_order_amount();

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  subject text not null, message text not null,
  reply text, status text not null default 'open',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.tickets to authenticated;
grant all on public.tickets to service_role;
alter table public.tickets enable row level security;
create policy "own tickets read" on public.tickets for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own tickets insert" on public.tickets for insert to authenticated with check (user_id = auth.uid() and reply is null);
create policy "admin tickets update" on public.tickets for update to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.settings (
  id int primary key default 1 check (id = 1),
  site_name text not null default 'SplitFlix',
  upi_id text not null default 'yourname@upi',
  upi_name text not null default 'SplitFlix',
  whatsapp text not null default ''
);
grant select on public.settings to anon, authenticated;
grant update on public.settings to authenticated;
grant all on public.settings to service_role;
alter table public.settings enable row level security;
create policy "public read settings" on public.settings for select to anon, authenticated using (true);
create policy "admin update settings" on public.settings for update to authenticated using (public.has_role(auth.uid(),'admin'));
insert into public.settings (id) values (1);

-- slots left per service (public)
create or replace function public.service_slots_left()
returns table(service_id uuid, total int, used int)
language sql stable security definer set search_path=public as $$
  select s.id,
    coalesce((select sum(max_slots)::int from master_accounts m where m.service_id = s.id),0),
    coalesce((select count(*)::int from orders o join master_accounts m on m.id=o.account_id
       where m.service_id = s.id and o.status='active' and o.expires_at > now()),0)
  from services s
$$;
grant execute on function public.service_slots_left() to anon, authenticated;

-- customer credential reveal
create or replace function public.my_credentials(_order_id uuid)
returns table(login_email text, login_password text, profile_label text)
language sql stable security definer set search_path=public as $$
  select m.login_email, m.login_password, o.profile_label
  from orders o join master_accounts m on m.id = o.account_id
  where o.id = _order_id and o.user_id = auth.uid() and o.status='active' and o.expires_at > now()
$$;
grant execute on function public.my_credentials(uuid) to authenticated;

-- admin approve with capacity check
create or replace function public.approve_order(_order_id uuid, _account_id uuid, _profile_label text)
returns void language plpgsql security definer set search_path=public as $$
declare v_months int; v_max int; v_used int; v_plan_service uuid; v_acc_service uuid;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  select p.months, p.service_id into v_months, v_plan_service from orders o join plans p on p.id=o.plan_id where o.id=_order_id;
  select max_slots, service_id into v_max, v_acc_service from master_accounts where id=_account_id;
  if v_plan_service is distinct from v_acc_service then raise exception 'Account is for a different service'; end if;
  select count(*) into v_used from orders where account_id=_account_id and status='active' and expires_at > now() and id <> _order_id;
  if v_used >= v_max then raise exception 'This account is full'; end if;
  update orders set status='active', account_id=_account_id, profile_label=_profile_label,
    starts_at=now(), expires_at=now() + make_interval(months => v_months)
  where id=_order_id;
end $$;
grant execute on function public.approve_order(uuid, uuid, text) to authenticated;

-- seed
with s as (
  insert into public.services (name, tagline, hue, sort) values
  ('Netflix','Premium 4K UHD, own profile',25,1),
  ('Prime Video','Movies, series & Prime perks',230,2),
  ('Disney+ Hotstar','Cricket, Marvel & Disney',255,3),
  ('SonyLIV','Sports & originals',290,4),
  ('Spotify','Ad-free music, family slot',150,5),
  ('YouTube Premium','No ads, background play',15,6)
  returning id, name)
insert into public.plans (service_id, name, months, price, mrp)
select s.id, v.n, v.m, v.p, v.mrp from s join (values
 ('Netflix','1 Month',1,199,649),('Netflix','3 Months',3,549,1947),('Netflix','12 Months',12,1999,7788),
 ('Prime Video','1 Month',1,79,299),('Prime Video','3 Months',3,219,599),('Prime Video','12 Months',12,699,1499),
 ('Disney+ Hotstar','1 Month',1,99,299),('Disney+ Hotstar','3 Months',3,269,899),('Disney+ Hotstar','12 Months',12,899,1499),
 ('SonyLIV','1 Month',1,69,299),('SonyLIV','12 Months',12,599,1499),
 ('Spotify','1 Month',1,59,179),('Spotify','3 Months',3,159,537),
 ('YouTube Premium','1 Month',1,49,149),('YouTube Premium','12 Months',12,449,1490)
) as v(svc,n,m,p,mrp) on v.svc = s.name;