import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { databases, DATABASE_ID, PRODUCT_COLLECTION_ID, CATEGORY_COLLECTION_ID } from './appwrite';

// Types
interface Product {
  $id: string;
  title: string;
  price: number;
  thumbnail?: string;
  categories: any;
}

interface Category {
  $id: string;
  name: string;
}

function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all'); 

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          databases.listDocuments(DATABASE_ID, CATEGORY_COLLECTION_ID),
          databases.listDocuments(DATABASE_ID, PRODUCT_COLLECTION_ID)
        ]);
        
        setCategories(catRes.documents as unknown as Category[]);
        setProducts((prodRes.documents as unknown as Product[]).reverse());
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => {
        const catId = Array.isArray(p.categories) ? p.categories[0]?.$id : (p.categories?.$id || p.categories);
        return catId === activeCategory;
      });

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 scroll-smooth">
      
      {/* 🌟 Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-20 flex items-center justify-between">
          <Link to="/" className="text-lg md:text-2xl font-black text-indigo-700 tracking-tighter uppercase flex items-center gap-2">
            <span className="bg-indigo-600 text-white w-10 h-10 flex items-center justify-center rounded-xl shrink-0">B</span>
            <span className="hidden sm:block">Building Developments & Technologies</span>
            <span className="sm:hidden">BDT Platform</span>
          </Link>
          
          <div className="flex items-center gap-4 sm:gap-6">
            {/* 🔴 নতুন কন্ট্যাক্ট লিংক */}
            <a href="#contact" className="hidden sm:block text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
              Contact Us
            </a>
            <Link to="/login" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-slate-100 px-5 py-2.5 rounded-full hover:bg-indigo-50 shrink-0">
              Admin Login
            </Link>
          </div>
        </div>
      </nav>

      {/* 🌟 Hero Section */}
      <header className="bg-slate-900 text-white py-16 md:py-20 px-4 sm:px-6 lg:px-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 z-0"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            Building Developments <br className="hidden md:block"/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">& Technologies (BDT)</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
            স্মার্ট সলিউশন, প্রিমিয়াম প্রপার্টি এবং লেটেস্ট টেকনোলজি—সবকিছু এখন আপনার হাতের মুঠোয়। 
            আপনার প্রয়োজনীয় সেরা সার্ভিসটি বেছে নিন আজই।
          </p>
        </div>
      </header>

      {/* 🌟 Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10">
        
        {/* Category Filter */}
        <div className="mb-12">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button 
              onClick={() => setActiveCategory('all')}
              className={`px-6 py-3 rounded-full font-bold text-sm transition-all shadow-sm ${activeCategory === 'all' ? 'bg-indigo-600 text-white shadow-md transform scale-105' : 'bg-white text-slate-600 hover:bg-indigo-50 border border-slate-200'}`}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button 
                key={cat.$id}
                onClick={() => setActiveCategory(cat.$id)}
                className={`px-6 py-3 rounded-full font-bold text-sm transition-all shadow-sm ${activeCategory === cat.$id ? 'bg-indigo-600 text-white shadow-md transform scale-105' : 'bg-white text-slate-600 hover:bg-indigo-50 border border-slate-200'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-6xl mb-4 block">🏜️</span>
            <h3 className="text-2xl font-bold text-slate-700">এই ক্যাটাগরিতে কোনো প্রোডাক্ট নেই!</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map(product => {
              let catName = 'Premium';
              if (Array.isArray(product.categories)) catName = product.categories[0]?.name || catName;
              else if (product.categories?.name) catName = product.categories.name;

              return (
                <Link 
                  to={`/product/${product.$id}`} 
                  key={product.$id}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl border border-slate-100 transition-all duration-300 transform hover:-translate-y-2 group flex flex-col"
                >
                  <div className="relative h-64 overflow-hidden bg-slate-100">
                    {product.thumbnail ? (
                      <img 
                        src={product.thumbnail} 
                        alt={product.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold">No Image</div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-black text-indigo-700 shadow-sm uppercase tracking-wider">
                        {catName}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-extrabold text-slate-800 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {product.title}
                    </h3>
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Price</p>
                        <p className="text-lg font-black text-slate-900">৳{product.price.toLocaleString('en-IN')}</p>
                      </div>
                      <span className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* 🌟 Contact Section (নতুন যুক্ত করা হলো) */}
      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-20">
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 md:p-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">যেকোনো প্রয়োজনে যোগাযোগ করুন</h2>
            <p className="text-slate-500 font-medium max-w-2xl mx-auto">
              আমাদের সার্ভিস, প্রপার্টি বা সফটওয়্যার সম্পর্কে বিস্তারিত জানতে সরাসরি কল করুন অথবা হোয়াটসঅ্যাপে মেসেজ দিন। আমাদের টিম আপনার সেবায় সবসময় প্রস্তুত।
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Phone Card */}
            <div className="bg-slate-50 p-8 rounded-3xl text-center hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 mx-auto bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm">📞</div>
              <h3 className="font-black text-slate-800 text-lg mb-2">সরাসরি কল করুন</h3>
              <p className="text-indigo-600 font-bold text-xl">+880 1633334466</p>
            </div>
            
            {/* WhatsApp Card */}
            <div className="bg-slate-50 p-8 rounded-3xl text-center hover:-translate-y-2 transition-transform duration-300 border-2 border-transparent hover:border-green-100">
              <div className="w-16 h-16 mx-auto bg-green-100 text-green-500 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm">💬</div>
              <h3 className="font-black text-slate-800 text-lg mb-2">হোয়াটসঅ্যাপ মেসেজ</h3>
              {/* wa.me লিংকে আপনার আসল নাম্বার বসাবেন */}
              <a href="https://wa.me/8801633334466" target="_blank" rel="noreferrer" className="inline-block bg-green-500 text-white font-bold px-6 py-2 rounded-full hover:bg-green-600 transition-colors mt-2 shadow-md">
                মেসেজ পাঠান
              </a>
            </div>

            {/* Email Card */}
            <div className="bg-slate-50 p-8 rounded-3xl text-center hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 mx-auto bg-red-100 text-red-500 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm">✉️</div>
              <h3 className="font-black text-slate-800 text-lg mb-2">ইমেইল করুন</h3>
              <p className="text-slate-600 font-bold">info@bdtplatform.com</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🌟 Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 text-center border-t border-slate-800 mt-10">
        <p className="font-bold">© {new Date().getFullYear()} Building Developments & Technologies (BDT). All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;