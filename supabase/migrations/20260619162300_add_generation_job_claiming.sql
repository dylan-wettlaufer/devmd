alter table public.generation_jobs
  add column if not exists run_after timestamp with time zone not null default now(),
  add column if not exists locked_at timestamp with time zone,
  add column if not exists locked_by text,
  add column if not exists max_attempts integer not null default 3,
  add column if not exists last_heartbeat_at timestamp with time zone,
  add constraint generation_jobs_max_attempts_check check (max_attempts > 0);

create index if not exists generation_jobs_claim_idx
  on public.generation_jobs (status, run_after, created_at)
  where status = 'queued';

create index if not exists generation_jobs_locked_idx
  on public.generation_jobs (status, locked_at)
  where status = 'running';

create or replace function public.claim_next_generation_job(
  worker_id text,
  stale_after interval default interval '15 minutes'
)
returns public.generation_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_job public.generation_jobs;
begin
  with next_job as (
    select id
    from public.generation_jobs
    where (
      status = 'queued'
      and run_after <= now()
      and attempts < max_attempts
    )
    or (
      status = 'running'
      and locked_at < now() - stale_after
      and attempts < max_attempts
    )
    order by
      case when status = 'running' then 0 else 1 end,
      run_after asc,
      created_at asc
    for update skip locked
    limit 1
  )
  update public.generation_jobs
  set
    status = 'running',
    attempts = attempts + 1,
    started_at = coalesce(started_at, now()),
    locked_at = now(),
    locked_by = worker_id,
    last_heartbeat_at = now(),
    error_message = null,
    updated_at = now()
  from next_job
  where generation_jobs.id = next_job.id
  returning generation_jobs.* into claimed_job;

  return claimed_job;
end;
$$;

revoke all on function public.claim_next_generation_job(text, interval) from public;
revoke execute on function public.claim_next_generation_job(text, interval) from anon;
revoke execute on function public.claim_next_generation_job(text, interval) from authenticated;
grant execute on function public.claim_next_generation_job(text, interval) to service_role;
