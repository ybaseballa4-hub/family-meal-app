import { useState } from 'react';
import { Mail, Lock, User, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

export function SignUpForm({ onSwitchToLogin }: SignUpFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('有効なメールアドレスを入力してください');
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    setLoading(true);

    const { error: signUpError } = await signUp(email, password, name);

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('このメールアドレスは既に登録されています');
      } else {
        setError('アカウント作成に失敗しました。もう一度お試しください');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="disney-card border-4 border-disney-blue-300 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-disney-blue-500 to-disney-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-cute transform hover:rotate-12 transition-transform">
            <UserPlus className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">アカウント作成</h1>
          <p className="text-gray-600">新しいアカウントを作成しましょう</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <User className="w-4 h-4 mr-2 text-orange-500" />
              名前
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="太郎"
              required
              className="w-full border-3 border-disney-blue-200 rounded-2xl px-4 py-3 focus:border-disney-blue-500 focus:ring-4 focus:ring-primary-200 outline-none transition-all"
            />
          </div>

          <div>
            <label htmlFor="email" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <Mail className="w-4 h-4 mr-2 text-orange-500" />
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              required
              className="w-full border-3 border-disney-blue-200 rounded-2xl px-4 py-3 focus:border-disney-blue-500 focus:ring-4 focus:ring-primary-200 outline-none transition-all"
            />
          </div>

          <div>
            <label htmlFor="password" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <Lock className="w-4 h-4 mr-2 text-orange-500" />
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border-3 border-disney-blue-200 rounded-2xl px-4 py-3 focus:border-disney-blue-500 focus:ring-4 focus:ring-primary-200 outline-none transition-all"
            />
            <p className="mt-2 text-xs text-gray-500">6文字以上で入力してください</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="disney-button w-full bg-gradient-to-r from-accent-400 to-primary-500 hover:from-accent-500 hover:to-primary-600 text-white text-lg font-bold py-4 px-8 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'アカウント作成中...' : 'アカウント作成'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onSwitchToLogin}
            className="text-primary-600 hover:text-primary-700 font-bold text-sm"
          >
            すでにアカウントをお持ちの方はログイン
          </button>
        </div>
      </div>
    </div>
  );
}
