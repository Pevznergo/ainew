CREATE TABLE IF NOT EXISTS "Demo" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL UNIQUE,
  "logo_name" text NOT NULL,
  "logo_url" text,
  "background_color" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Добавляем тестовые данные
INSERT INTO "Demo" ("name", "logo_name", "logo_url") 
VALUES ('pevzner', 'Сергей Минаев', '/demo/minaev.png')
ON CONFLICT ("name") DO NOTHING;