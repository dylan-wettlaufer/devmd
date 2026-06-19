revoke execute on function public.claim_next_generation_job(text, interval) from anon;
revoke execute on function public.claim_next_generation_job(text, interval) from authenticated;
revoke all on function public.claim_next_generation_job(text, interval) from public;
grant execute on function public.claim_next_generation_job(text, interval) to service_role;
