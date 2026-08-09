-- Lettura pubblica (chiunque abbia l'URL vede l'immagine)
create policy "Public read access"
on storage.objects for select
using (bucket_id = 'card-images');

-- Upload/update/delete permessi a tutti (uso personale, stessa logica delle tabelle)
create policy "Allow all uploads"
on storage.objects for insert
with check (bucket_id = 'card-images');

create policy "Allow all updates"
on storage.objects for update
using (bucket_id = 'card-images');

create policy "Allow all deletes"
on storage.objects for delete
using (bucket_id = 'card-images');