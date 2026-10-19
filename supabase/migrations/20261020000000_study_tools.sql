-- Blocos de questões e cartões de memorização também sincronizam (lib/sync.ts).

alter table public.records drop constraint records_collection_check;

alter table public.records add constraint records_collection_check check (
  collection in (
    'topics', 'sessions', 'tasks', 'mistakes', 'mockExams', 'essays', 'repertoire', 'questionBlocks', 'flashcards',
    'progress', 'ajustes'
  )
);
