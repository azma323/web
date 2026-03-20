import { useState } from 'react';
import { Link } from 'react-router-dom';
import { account } from './appwrite'; //

function Login() {
  const [email, setEmail] = useState(''); //[cite: 1]
  const [password, setPassword] = useState(''); //[cite: 1]
  const [error, setError] = useState(''); //[cite: 1]
  const [loading, setLoading] = useState(false); //[cite: 1]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); //[cite: 1]
    setLoading(true); //[cite: 1]
    setError(''); //[cite: 1]

    try {
      // 🔴 ম্যাজিক ট্রিক: লগইন করার আগে পুরোনো সেশন ক্লিয়ার করার চেষ্টা করবে[cite: 1]। 
      // কিন্তু সেশন না পেয়ে 404 এরর দিলে পেজ আটকাবে না, চুপচাপ পরের ধাপে যাবে[cite: 1]!
      try {
        await account.deleteSession('current'); //[cite: 1]
      } catch (sessionError) {
        console.log('No previous session found, proceeding to login...'); //[cite: 1]
      }

      // নতুন লগইন
      await account.createEmailPasswordSession(email, password); //[cite: 1]
      
      // সফল হলে ড্যাশবোর্ডে পাঠাবে
      window.location.href = '/admin'; //[cite: 1]
      
    } catch (err: any) {
      console.error(err); //[cite: 1]
      // এখানে শুধু আসল লগইন এরর দেখাবে (যেমন- পাসওয়ার্ড ভুল)
      setError(err.message || 'Login failed. Check your email and password.'); //[cite: 1]
    } finally {
      setLoading(false); //[cite: 1]
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* 🌟 Simple Header */}
      <header className="bg-white py-6 px-8 flex items-center justify-between border-b border-slate-200">
         <Link to="/" className="text-3xl font-black text-orange-500 tracking-tighter">
            BDT<span className="text-slate-800">.com</span>
         </Link>
         <Link to="/" className="font-bold text-slate-500 hover:text-orange-600 transition-colors">
           ← Back to Store
         </Link>
      </header>

      {/* 📝 Login Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-slate-100 p-10 flex flex-col justify-center">
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-3xl">⚙️</span>
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-2">Admin Panel</h2>
            <p className="text-slate-500 font-medium">Authorized personnel only</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 border border-red-100 text-center">
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
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full px-5 py-4 rounded-xl border-2 border-slate-100 outline-none focus:border-orange-500 bg-slate-50 transition-colors" 
                placeholder="admin@bdt.com" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Password</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full px-5 py-4 rounded-xl border-2 border-slate-100 outline-none focus:border-orange-500 bg-slate-50 transition-colors" 
                placeholder="••••••••" 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-slate-900 hover:bg-orange-500 disabled:bg-slate-300 transition-colors text-white font-black py-4 rounded-xl shadow-lg mt-4"
            >
              {loading ? 'VERIFYING...' : 'SECURE LOGIN'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Login;