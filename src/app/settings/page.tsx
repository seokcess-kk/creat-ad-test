'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase, isDevMode } from '@/lib/db/supabase';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    // 개발 모드: 데모 사용자 데이터 사용
    if (isDevMode || !supabase) {
      setUser({ id: 'dev-user', email: 'demo@example.com' });
      setEmail('demo@example.com');
      setName('Demo User');
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push('/login');
      return;
    }

    setUser(session.user);
    setEmail(session.user.email || '');
    setName(session.user.user_metadata?.name || '');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // 개발 모드: 업데이트 시뮬레이션
    if (isDevMode || !supabase) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        data: { name },
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('프로필 업데이트 중 오류가 발생했습니다');
      console.error('Update profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setLoading(true);
    setError(null);

    // 개발 모드: 비밀번호 변경 불가 메시지
    if (isDevMode || !supabase) {
      alert('개발 모드에서는 비밀번호 변경이 지원되지 않습니다');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      alert('비밀번호 재설정 링크가 이메일로 전송되었습니다');
    } catch (err) {
      setError('비밀번호 재설정 요청 중 오류가 발생했습니다');
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">설정</h1>
          <p className="text-gray-600 mt-2">계정 정보 및 API 설정을 관리하세요</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            프로필이 성공적으로 업데이트되었습니다
          </div>
        )}

        {/* Profile Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>프로필</CardTitle>
            <CardDescription>기본 프로필 정보를 관리합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  이름
                </label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <Input id="email" type="email" value={email} disabled className="bg-gray-50" />
                <p className="text-xs text-gray-500 mt-1">이메일은 변경할 수 없습니다</p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? '저장 중...' : '프로필 저장'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>보안</CardTitle>
            <CardDescription>비밀번호 및 보안 설정을 관리합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-700 mb-2">비밀번호를 변경하시겠습니까?</p>
                <Button
                  variant="outline"
                  onClick={handleChangePassword}
                  disabled={loading}
                >
                  비밀번호 재설정 이메일 보내기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Keys (Placeholder) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>API 키 관리</CardTitle>
            <CardDescription>
              AI 서비스 연동을 위한 API 키를 관리합니다 (개발 중)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Anthropic API Key (Claude)
                </label>
                <Input
                  type="password"
                  placeholder="sk-ant-..."
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  현재 시스템 기본 키를 사용 중입니다
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Google AI API Key (Gemini)
                </label>
                <Input
                  type="password"
                  placeholder="AIza..."
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  현재 시스템 기본 키를 사용 중입니다
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">위험 영역</CardTitle>
            <CardDescription>계정 삭제 등 되돌릴 수 없는 작업입니다</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" disabled>
              계정 삭제 (개발 중)
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
