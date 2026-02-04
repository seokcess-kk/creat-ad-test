'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onReset?: () => void;
  showReset?: boolean;
}

export function Header({ onReset, showReset = false }: HeaderProps) {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Ad Creative Generator
        </Link>
        {showReset && onReset && (
          <Button variant="ghost" onClick={onReset}>
            처음부터 다시
          </Button>
        )}
      </div>
    </header>
  );
}
