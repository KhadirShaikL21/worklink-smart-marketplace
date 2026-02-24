import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { User, Mail, Phone, Lock, Briefcase, IndianRupee, Clock, FileText, Loader2, AlertCircle, Camera, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const InputField = ({ icon: Icon, label, ...props }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-semibold text-gray-700">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
        <Icon className="h-5 w-5" />
      </div>
      <input
        {...props}
        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 sm:text-sm transition-all duration-200"
      />
    </div>
  </div>
);

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    isWorker: false,
    title: '',
    skills: '',
    experienceYears: '',
    hourlyRate: '',
    bio: ''
  });
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('password', form.password);
      formData.append('isWorker', form.isWorker);

      if (form.isWorker) {
        const profile = {
          title: form.title,
          skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
          experienceYears: Number(form.experienceYears) || 0,
          hourlyRate: Number(form.hourlyRate) || 0,
          bio: form.bio
        };
        formData.append('profile', JSON.stringify(profile));
      }

      if (avatar) {
        formData.append('avatar', avatar);
      }

      await register(formData);
      navigate('/verify-email');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden"
      >
        <div className="px-8 pt-8 pb-6 text-center border-b border-gray-100 bg-gray-50/30">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <div className="p-8">
            <form className="space-y-8" onSubmit={onSubmit}>
            {error && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="rounded-xl bg-red-50 p-4 border border-red-100 flex items-start gap-3"
                >
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="text-sm text-red-700">{error}</div>
                </motion.div>
            )}

            {/* Account Type Toggle */}
            <div className="flex flex-col items-center gap-4">
                <span className="text-sm font-medium text-gray-500">I want to...</span>
                <div className="bg-gray-100 p-1.5 rounded-xl inline-flex relative">
                    {/* Animated background pill */}
                    <motion.div 
                        className="absolute inset-y-1.5 bg-white shadow-sm rounded-lg"
                        layoutId="toggle-pill"
                        initial={false}
                        animate={{ 
                            left: form.isWorker ? '50%' : '6px',
                            right: form.isWorker ? '6px' : '50%'
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                    
                    <button
                        type="button"
                        onClick={() => setForm({ ...form, isWorker: false })}
                        className={clsx(
                            "relative z-10 px-8 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200",
                            !form.isWorker ? "text-primary-600" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Hire Talent
                    </button>
                    <button
                        type="button"
                        onClick={() => setForm({ ...form, isWorker: true })}
                        className={clsx(
                            "relative z-10 px-8 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200",
                            form.isWorker ? "text-primary-600" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Find Work
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Profile Photo Upload */}
                <div className="flex justify-center">
                    <div className="relative group">
                        <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 group-hover:border-primary-400 transition-colors">
                            {avatar ? (
                                <img src={URL.createObjectURL(avatar)} alt="Preview" className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-10 w-10 text-gray-400" />
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                            <Camera className="h-4 w-4 text-gray-600" />
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={e => setAvatar(e.target.files[0])}
                            />
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <InputField 
                            icon={User} 
                            label="Full Name" 
                            type="text" 
                            placeholder="John Doe" 
                            required 
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                        />
                    </div>
                    
                    <InputField 
                        icon={Mail} 
                        label="Email Address" 
                        type="email" 
                        placeholder="john@example.com" 
                        required 
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                    />

                    <InputField 
                        icon={Phone} 
                        label="Phone Number" 
                        type="tel" 
                        placeholder="+91 98765 43210" 
                        required 
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                    />

                    <div className="md:col-span-2">
                        <InputField 
                            icon={Lock} 
                            label="Password" 
                            type="password" 
                            placeholder="Min. 8 characters" 
                            required
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                        />
                    </div>
                </div>

                <AnimatePresence>
                    {form.isWorker && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-gray-50 rounded-2xl p-6 border border-gray-200 space-y-6 overflow-hidden"
                        >
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-200 pb-4">
                                <Briefcase className="w-5 h-5 text-primary-600" />
                                Professional Profile
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <InputField 
                                        icon={Briefcase} 
                                        label="Professional Title" 
                                        type="text" 
                                        placeholder="e.g. Senior Electrician" 
                                        required={form.isWorker}
                                        value={form.title}
                                        onChange={e => setForm({ ...form, title: e.target.value })}
                                    />
                                </div>
                                
                                <InputField 
                                    icon={Clock} 
                                    label="Experience (Years)" 
                                    type="number" 
                                    min="0"
                                    placeholder="5" 
                                    required={form.isWorker}
                                    value={form.experienceYears}
                                    onChange={e => setForm({ ...form, experienceYears: e.target.value })}
                                />

                                <InputField 
                                    icon={IndianRupee} 
                                    label="Hourly Rate (₹)" 
                                    type="number" 
                                    min="0"
                                    placeholder="500" 
                                    required={form.isWorker}
                                    value={form.hourlyRate}
                                    onChange={e => setForm({ ...form, hourlyRate: e.target.value })}
                                />
                                
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="block text-sm font-semibold text-gray-700">Skills</label>
                                    <input
                                        type="text"
                                        className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 sm:text-sm transition-colors"
                                        placeholder="Wiring, Pipe Fitting, Repair (comma separated)"
                                        required={form.isWorker}
                                        value={form.skills}
                                        onChange={e => setForm({ ...form, skills: e.target.value })}
                                    />
                                    <p className="text-xs text-gray-500">Add 3-5 main skills separated by commas</p>
                                </div>

                                <div className="md:col-span-2 space-y-1.5">
                                     <label className="block text-sm font-semibold text-gray-700">Bio</label>
                                     <div className="relative">
                                         <div className="absolute top-3 left-3 text-gray-400">
                                             <FileText className="w-5 h-5" />
                                         </div>
                                         <textarea
                                            rows={3}
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 sm:text-sm transition-colors"
                                            placeholder="Brief description of your expertise and work ethic..."
                                            value={form.bio}
                                            onChange={e => setForm({ ...form, bio: e.target.value })}
                                         />
                                     </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className={clsx(
                        "w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-xl shadow-primary-600/20 text-base font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all active:scale-[0.98]",
                        loading && "opacity-70 cursor-wait"
                    )}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Creating Account...
                        </>
                    ) : (
                        <>
                            Create Account <ArrowRight className="ml-2 w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
            </form>
            <p className="mt-8 text-center text-xs text-gray-400">
                By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
        </div>
      </motion.div>
    </div>
  );
}
