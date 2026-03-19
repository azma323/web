import { useState } from 'react';
import { account } from './appwrite';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 🔴 ম্যাজিক ট্রিক: লগইন করার আগে পুরোনো সেশন ক্লিয়ার করার চেষ্টা করবে। 
      // কিন্তু সেশন না পেয়ে 404 এরর দিলে পেজ আটকাবে না, চুপচাপ পরের ধাপে যাবে!
      try {
        await account.deleteSession('current');
      } catch (sessionError) {
        console.log('No previous session found, proceeding to login...');
      }

      // নতুন লগইন
      await account.createEmailPasswordSession(email, password);
      
      // সফল হলে ড্যাশবোর্ডে পাঠাবে
      window.location.href = '/admin';
      
    } catch (err: any) {
      console.error(err);
      // এখানে শুধু আসল লগইন এরর দেখাবে (যেমন- পাসওয়ার্ড ভুল)
      setError(err.message || 'Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-slate-100 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-3xl font-black mx-auto mb-4 shadow-lg">B</div>
          <h2 className="text-3xl font-black text-slate-800">Admin Login</h2>
          <p className="text-slate-500 font-medium mt-2">Welcome back! Please enter your details.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold text-center mb-6 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Email Address</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full px-5 py-4 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none bg-slate-50 transition-colors" 
              placeholder="admin@bdtplatform.com" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full px-5 py-4 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none bg-slate-50 transition-colors" 
              placeholder="••••••••" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-slate-900 text-white font-black py-4 rounded-xl mt-4 hover:bg-indigo-600 transition-all disabled:bg-slate-400 shadow-lg"
          >
            {loading ? 'VERIFYING...' : 'SECURE LOGIN'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;