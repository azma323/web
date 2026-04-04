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
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    account.get()
      .then(res => setUser(res))
      .catch(() => setUser(null))
      .finally(() => setLoadingAuth(false));
  }, []);

  // 🔴 ম্যাজিক: এখান থেকে if (loading) return <div>...</div> লাইনটি পুরোপুরি মুছে দেওয়া হলো। 
  // এখন সাইট সাথে সাথে ওপেন হবে!

  return (
    <BrowserRouter>
      <Routes>
        {/* পাবলিক পেজগুলো কোনো লোডিং ছাড়াই সাথে সাথে রেন্ডার হবে */}
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* শুধু লগইন আর অ্যাডমিনের জন্য অথেন্টিকেশন চেক করা হবে */}
        <Route path="/login" element={loadingAuth ? <div>Loading...</div> : (user ? <Navigate to="/admin" /> : <Login />)} />
        <Route path="/admin" element={loadingAuth ? <div>Authenticating...</div> : (user ? <AdminDashboard /> : <Navigate to="/login" />)} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;