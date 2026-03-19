import { useState } from 'react';
import { account } from './appwrite';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return alert("Please enter email and password!");
    
    setIsLoggingIn(true);
    try {
      // 🛠️ মেইন ফিক্স: প্রথমে যেকোনো আটকে থাকা সেশন জোড় করে মুছে ফেলা
      try {
        await account.deleteSession('current');
        console.log("Cleared old stuck session.");
      } catch (err) {
        // আগে থেকে সেশন না থাকলে এই এরর ইগনোর করবে
      }

      // 🚀 এবার একদম ফ্রেশভাবে নতুন লগইন সেশন তৈরি করবে
      await account.createEmailPasswordSession(email, password);
      
      // লগইন সফল হলে পুরো পেজ রিলোড দিয়ে ড্যাশবোর্ডে পাঠাবে (যাতে App.tsx নতুন ডাটা পায়)
      window.location.href = '/admin'; 
      
    } catch (error: any) {
      console.error("Appwrite Error:", error.message);
      
      // যদি তারপরেও সেশন এরর আসে, তবে সরাসরি ড্যাশবোর্ডে পাঠিয়ে দেবে
      if (error.message.includes('prohibited')) {
         window.location.href = '/admin';
      } else {
         alert(`লগইন ব্যর্থ হয়েছে: ${error.message}`); 
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 font-sans px-4">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-200">
        <h2 className="text-3xl font-black text-slate-800 mb-2 text-center">Admin Login</h2>
        <p className="text-slate-400 text-center mb-8 font-medium">Enter your credentials</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Email Address</label>
            <input 
              type="email" 
              placeholder="admin@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none font-bold transition-all"
            />
          </div>
          
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none font-bold transition-all"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all transform hover:-translate-y-1 disabled:bg-slate-300 disabled:translate-y-0"
          >
            {isLoggingIn ? 'AUTHENTICATING...' : 'UNLOCK DASHBOARD'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;