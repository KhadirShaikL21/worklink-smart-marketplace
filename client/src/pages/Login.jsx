import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Mail, Lock, Loader2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({ emailOrPhone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Quick validation
    if (!form.emailOrPhone || !form.password) {
        setError(t('auth.enterBoth'));
        return;
    }

    try {
      await login(form);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Form */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 py-12 relative z-10"
      >
        <div className="mx-auto w-full max-w-sm lg:w-96">
            <div className="mb-10">
                <div className="h-12 w-12 bg-primary-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-primary-600/30">
                    <Lock className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('auth.welcomeBack')}</h2>
                <p className="mt-2 text-sm text-gray-600">
                    {t('auth.noAccount')}{' '}
                    <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                        {t('auth.signUpFree')}
                    </Link>
                </p>
            </div>

            <form className="space-y-6" onSubmit={onSubmit}>
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-xl bg-red-50 p-4 border border-red-100 flex items-start gap-3"
                    >
                        <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        <div className="text-sm text-red-700">{error}</div>
                    </motion.div>
                )}

                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            {t('auth.emailOrPhone')}
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-500 text-gray-400">
                                <Mail className="h-5 w-5" />
                            </div>
                            <input
                                type="text"
                                required
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 sm:text-sm transition-all duration-200"
                                placeholder="name@worklink.com"
                                value={form.emailOrPhone}
                                onChange={e => setForm({ ...form, emailOrPhone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-sm font-semibold text-gray-700">
                                {t('auth.password')}
                            </label>
                            <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                                {t('auth.forgotPassword')}
                            </a>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-500 text-gray-400">
                                <Lock className="h-5 w-5" />
                            </div>
                            <input
                                type="password"
                                required
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 sm:text-sm transition-all duration-200"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className={clsx(
                            "w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-primary-600/20 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all active:scale-[0.98]",
                            loading && "opacity-70 cursor-wait"
                        )}
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                {t('auth.signIn')} <ArrowRight className="ml-2 w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </form>
            
            <div className="mt-8 text-center text-xs text-gray-400">
                {t('auth.protectedBy')}
            </div>
        </div>
      </motion.div>

      {/* Right Side - Image/Background */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:block relative w-0 flex-1 bg-gray-900 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-primary-900/90 to-black/40 z-10 mix-blend-multiply" />
        <img
          className="absolute inset-0 h-full w-full object-cover opacity-90"
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80"
          alt="Work environment"
        />
        <div className="absolute inset-0 flex flex-col justify-end p-12 z-20 text-white">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/10 max-w-lg mb-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-500/20 rounded-lg text-green-300">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <span className="text-green-300 font-semibold tracking-wide text-sm uppercase">Smart Matching</span>
                </div>
                <h3 className="text-3xl font-bold mb-4 leading-tight">
                    "WorkLink connected us with the perfect professionals for our home renovation instantly."
                </h3>
                <div className="flex items-center gap-4">
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" className="w-10 h-10 rounded-full border-2 border-white/20" />
                    <div>
                        <p className="font-semibold text-white">Sarah Jenkins</p>
                        <p className="text-gray-300 text-sm">Homeowner</p>
                    </div>
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
