import { useState } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState<string | null>(null)

  // ترجمة أخطاء Supabase للعربية
  function translateError(msg: string): string {
    if (msg.includes('Invalid login credentials'))
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
    if (msg.includes('Email not confirmed'))
      return 'يرجى تأكيد بريدك الإلكتروني أولاً'
    if (msg.includes('User already registered'))
      return 'هذا البريد مسجّل بالفعل، سجّل دخولك'
    if (msg.includes('Password should be at least'))
      return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
    return 'حدث خطأ، حاول مرة أخرى'
  }

  async function handleSubmit() {
    setError(null)
    setSuccess(null)

    if (!email || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور')
      return
    }

    setLoading(true)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        navigate({ to: '/' })

      } else {
        if (!fullName.trim()) {
          setError('يرجى إدخال الاسم الكامل')
          return
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        })
        if (error) throw error
        setSuccess('تم إنشاء الحساب! تحقق من بريدك الإلكتروني للتأكيد ✉️')
      }
    } catch (err: any) {
      setError(translateError(err.message))
    } finally {
      setLoading(false)
    }
  }

  function switchMode(next: 'signin' | 'signup') {
    setMode(next)
    setError(null)
    setSuccess(null)
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100
                 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">

        {/* ── الشعار ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center
                          w-16 h-16 bg-emerald-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl">🌿</span>
          </div>
          <h1 className="text-2xl font-bold text-emerald-800">الوادي الأخضر</h1>
          <p className="text-gray-500 text-sm mt-1">سوبر ماركت وعطارة</p>
        </div>

        {/* ── البطاقة ── */}
        <div className="bg-white rounded-2xl shadow-xl p-6">

          {/* تبويبات */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'signin' ? 'تسجيل الدخول' : 'حساب جديد'}
              </button>
            ))}
          </div>

          {/* حقول الإدخال */}
          <div className="space-y-4">

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="محمد أحمد"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3
                             text-sm focus:outline-none focus:ring-2
                             focus:ring-emerald-400 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                dir="ltr"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3
                           text-sm focus:outline-none focus:ring-2
                           focus:ring-emerald-400 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                كلمة المرور
              </label>
              <input
                type="password"
                dir="ltr"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-3
                           text-sm focus:outline-none focus:ring-2
                           focus:ring-emerald-400 transition"
              />
            </div>
          </div>

          {/* رسالة الخطأ */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700
                            text-sm rounded-xl px-4 py-3">
              ⚠️ {error}
            </div>
          )}

          {/* رسالة النجاح */}
          {success && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200
                            text-emerald-700 text-sm rounded-xl px-4 py-3">
              ✅ {success}
            </div>
          )}

          {/* زر الإرسال */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700
                       disabled:opacity-60 text-white font-semibold
                       py-3 rounded-xl transition-colors"
          >
            {loading
              ? '⏳ جاري التحميل...'
              : mode === 'signin' ? '🔑 دخول' : '✨ إنشاء الحساب'}
          </button>

          {/* العودة للمتجر */}
          <Link
            to="/"
            className="block text-center mt-5 text-sm text-gray-400
                       hover:text-emerald-600 transition-colors"
          >
            ← العودة للمتجر
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          الوادي الأخضر © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}