-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Разрешаем публичный доступ для чтения/записи
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Политика: любой может зарегистрироваться (INSERT)
CREATE POLICY "Allow insert" ON public.users
  FOR INSERT WITH CHECK (true);

-- Политика: любой может читать (для логина)
CREATE POLICY "Allow select" ON public.users
  FOR SELECT USING (true);

-- Политика: пользователь может обновить только свой пароль
CREATE POLICY "Allow update" ON public.users
  FOR UPDATE USING (auth.uid() = id);
