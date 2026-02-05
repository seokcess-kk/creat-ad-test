'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase, isDevMode } from '@/lib/db/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface HeaderProps {
  onReset?: () => void;
  showReset?: boolean;
}

export function Header({ onReset, showReset = false }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 개발 모드에서는 인증 건너뜀
    if (isDevMode || !supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    document.cookie = 'sb-access-token=; path=/; max-age=0';
    router.push('/login');
  };

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Ad Creative Generator
        </Link>
        <div className="flex items-center gap-4">
          {showReset && onReset && (
            <Button variant="ghost" onClick={onReset}>
              처음부터 다시
            </Button>
          )}
          {isDevMode ? (
            <span className="text-sm text-muted-foreground px-3 py-1 bg-yellow-100 rounded">
              개발 모드
            </span>
          ) : user ? (
            <>
              <span className="text-sm text-gray-600">{user.email}</span>
              <Button variant="outline" onClick={handleLogout}>
                로그아웃
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="outline">로그인</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
