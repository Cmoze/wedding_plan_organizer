-- An optional photo of the couple for the home page. The file lives in the private idea-photos
-- bucket under the wedding's folder, so the existing storage policies apply; changing which photo
-- is shown is a weddings update (couple and planner).

alter table public.weddings add column photo_path text;
