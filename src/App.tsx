import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { account } from './appwrite';
import Home from './Home';
import AdminDashboard from './AdminDashboard';
import Login from './Login';
import ProductDetails from './ProductDetails';
import Contact from './Contact';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // চেক করা হচ্ছে ইউজার লগইন করা কি না
    account.get()
      .then(res => {
        setUser(res); // ইউজার পাওয়া গেলে স্টেট আপডেট হবে
      })
      .catch(() => {
        setUser(null); // লগইন করা না থাকলে নাল হবে
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center font-bold">BDT Syncing...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={user ? <Navigate to="/admin" /> : <Login />} />
        
        {/* যদি ইউজার থাকে তবেই ড্যাশবোর্ড দেখাবে */}
        <Route 
          path="/admin" 
          element={user ? <AdminDashboard /> : <Navigate to="/login" />} 
        />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;