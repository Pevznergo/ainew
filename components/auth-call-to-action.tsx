import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function AuthCallToAction() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border bg-background p-4 text-center md:p-6">
      <p className="mb-4 text-sm text-muted-foreground">
        Начни диалог, чтобы получить быстрые и умные ответы на свои вопросы.
      </p>
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link href="/login">Войти</Link>
        </Button>
        <Button asChild>
          <Link href="/register">Регистрация</Link>
        </Button>
      </div>
    </div>
  );
}
