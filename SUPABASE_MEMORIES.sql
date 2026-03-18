-- Создание таблицы memories для хранения памяти пользователей

CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  source TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS политики
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Политика: любой может читать
CREATE POLICY "Allow public select memories" ON public.memories
  FOR SELECT USING (true);

-- Политика: любой может добавлять
CREATE POLICY "Allow public insert memories" ON public.memories
  FOR INSERT WITH CHECK (true);

-- Политика: любой может обновлять
CREATE POLICY "Allow public update memories" ON public.memories
  FOR UPDATE USING (true);

-- Политика: любой может удалять
CREATE POLICY "Allow public delete memories" ON public.memories
  FOR DELETE USING (true);

-- Индекс
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON public.memories(user_id);
