-- ============================================================================
-- Migration 002: Quote Number + Status Update
-- ============================================================================
-- Adds sequential quote numbering (R-0001 format) and updates status values
-- ============================================================================

-- 1. Add quote_number column with auto-increment sequence
create sequence if not exists so_quotes_number_seq start 1;

alter table so_quotes
  add column if not exists quote_number int;

-- Set default to use sequence
alter table so_quotes
  alter column quote_number set default nextval('so_quotes_number_seq');

-- 2. Populate existing quotes with sequential numbers (if any exist)
-- This assigns numbers to existing quotes in creation order
do $$
declare
  quote_record record;
  counter int := 1;
begin
  for quote_record in
    select id from so_quotes
    where quote_number is null
    order by created_at asc
  loop
    update so_quotes
    set quote_number = counter
    where id = quote_record.id;
    counter := counter + 1;
  end loop;

  -- Update sequence to continue from last assigned number
  perform setval('so_quotes_number_seq', counter);
end $$;

-- 3. Make quote_number NOT NULL after populating
alter table so_quotes
  alter column quote_number set not null;

-- 4. Create unique constraint on quote_number
alter table so_quotes
  add constraint so_quotes_quote_number_unique unique (quote_number);

-- 5. Create index for better query performance
create index if not exists idx_quotes_quote_number on so_quotes(quote_number);

-- 6. Update existing status values
-- draft → open (Não fechou)
-- sent → open (Não fechou)
-- approved → closed (Fechado)
-- rejected → inactive (Excluído)
update so_quotes set status = 'open' where status = 'draft';
update so_quotes set status = 'open' where status = 'sent';
update so_quotes set status = 'closed' where status = 'approved';
update so_quotes set status = 'inactive' where status = 'rejected';

-- 7. Add comment for documentation
comment on column so_quotes.quote_number is 'Sequential quote number for display as R-0001 format';
comment on column so_quotes.status is 'Quote status: open (Não fechou), closed (Fechado), inactive (Excluído/soft delete)';
