import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Query, OAuthProvider } from 'appwrite';
import { databases, account, DATABASE_ID, CATEGORY_COLLECTION_ID } from './appwrite';
// 🔴 ম্যাজিক: আমাদের তৈরি করা কাস্টম হুক ইম্পোর্ট করা হলো
import { useProducts } from './hooks/useProducts'; 

function Home() {
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSubCategoryId = searchParams.get('category');

  // 🔴 এন্টারপ্রাইজ আর্কিটেকচার: React Query-এর মাধ্যমে ০ সেকেন্ডে ডেটা লোড!
  const { data: products = [], isLoading: loadingProducts } = useProducts(selectedSubCategoryId);

  const handleCustomerLogin = () => {
    try {
      account.createOAuth2Session(
        OAuthProvider.Google,
        window.location.origin, 
        window.location.origin 
      );
    } catch (err) {
      console.error('Google Login Error:', err);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // 🔴 স্ট্রাকচারাল ফিক্স: Pagination Limit ১০০ করে দেওয়া হয়েছে
        const res = await databases.listDocuments(DATABASE_ID, CATEGORY_COLLECTION_ID, [
          Query.limit(100) 
        ]);
        setAllCategories(res.documents);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const mainCategories = allCategories.filter(c => !c.parent_id || c.parent_id === '');

  const handleMainCategoryClick = (mainCatId: string) => {
    if (expandedCategory === mainCatId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(mainCatId);
    }
  };

  const handleCategorySelect = (categoryId: string | null) => {
    if (categoryId) {
      setSearchParams({ category: categoryId });
    } else {
      setSearchParams({});
    }
    setIsSidebarOpen(false); 
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="bg-slate-900 text-white py-4 px-4 md:px-8 flex items-center justify-between sticky top-0 z-50 shadow-md">
         <div className="flex items-center gap-3">
           <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-white text-2xl hover:text-orange-400 transition-colors">
             ☰
           </button>
           <Link to="/" onClick={() => handleCategorySelect(null)} className="text-2xl md:text-3xl font-black text-orange-400 tracking-tighter">
              BDT<span className="text-white hidden md:inline">.com</span>
           </Link>
         </div>
         
         <div className="hidden md:flex flex-1 max-w-3xl mx-8">
            <input type="text" placeholder="Search products..." className="w-full px-4 py-2.5 rounded-l-md outline-none text-slate-900" />
            <button className="bg-orange-400 hover:bg-orange-500 transition-colors px-6 py-2.5 rounded-r-md font-bold text-slate-900">
              🔍
            </button>
         </div>

         <div className="flex items-center gap-3 md:gap-6">
           <Link to="/contact" className="font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-2">
             <span className="text-xl">📞</span> <span className="hidden md:inline">Contact</span>
           </Link>
           <button onClick={handleCustomerLogin} className="font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-2 border-l border-slate-700 pl-3 md:pl-6">
             <span className="text-xl">🛍️</span> <span className="hidden md:inline">Login</span>
           </button>
           <Link to="/login" className="font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-2 border-l border-slate-700 pl-3 md:pl-6">
             <span className="text-xl">⚙️</span> <span className="hidden md:inline">Admin</span>
           </Link>
         </div>
      </header>

      <main className="flex flex-1 w-full max-w-[1500px] mx-auto relative">
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-slate-900/60 z-[60] md:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)}></div>
        )}

        <aside className={`fixed md:sticky top-0 md:top-[72px] left-0 h-full md:h-[calc(100vh-72px)] w-64 bg-white border-r border-slate-200 overflow-y-auto z-[70] transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'} shrink-0`}>
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Department</h3>
            <button className="md:hidden text-slate-400 hover:text-red-500 font-bold text-xl" onClick={() => setIsSidebarOpen(false)}>✕</button>
          </div>
          
          <ul className="py-2">
            <li className="px-4 py-1.5">
              <button onClick={() => handleCategorySelect(null)} className={`w-full text-left text-sm font-medium hover:text-orange-600 transition-colors ${!selectedSubCategoryId ? 'text-orange-600 font-bold' : 'text-slate-700'}`}>
                All Products
              </button>
            </li>
            {mainCategories.map((mainCat) => {
              const subCats = allCategories.filter(c => c.parent_id === mainCat.$id);
              const isExpanded = expandedCategory === mainCat.$id;

              return (
                <li key={mainCat.$id} className="mt-1">
                  <button onClick={() => handleMainCategoryClick(mainCat.$id)} className="w-full text-left px-4 py-3 md:py-2 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <span className="text-sm font-bold text-slate-800 group-hover:text-orange-600 transition-colors">{mainCat.name}</span>
                    {subCats.length > 0 && <span className="text-xs text-slate-400 font-black">{isExpanded ? '−' : '+'}</span>}
                  </button>
                  {isExpanded && subCats.length > 0 && (
                    <ul className="bg-slate-50 py-2 border-l-2 border-orange-200 ml-4 pl-2 mr-4 rounded-br-lg mb-2">
                      {subCats.map((subCat) => (
                        <li key={subCat.$id}>
                          <button onClick={() => handleCategorySelect(subCat.$id)} className={`w-full text-left px-3 py-2 text-sm transition-colors rounded-md ${selectedSubCategoryId === subCat.$id ? 'text-orange-600 font-bold bg-orange-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}>
                            {subCat.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto bg-slate-100 min-h-[calc(100vh-72px)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-slate-200 gap-3">
             <h2 className="text-xl md:text-2xl font-black text-slate-800">
               {selectedSubCategoryId ? allCategories.find(c => c.$id === selectedSubCategoryId)?.name || 'Search Results' : 'All Recommended Products'}
             </h2>
             {selectedSubCategoryId && (
               <button onClick={() => handleCategorySelect(null)} className="w-fit text-sm font-bold text-red-500 hover:text-red-700 bg-red-50 px-4 py-2 rounded-full transition-colors self-start md:self-auto">
                 ✕ Clear Filter
               </button>
             )}
          </div>

          {loadingProducts ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500"></div></div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-6">
              {products.map(product => (
                <Link to={`/product/${product.$id}`} key={product.$id} className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full">
                  <div className="aspect-square bg-white relative p-2 md:p-4 flex items-center justify-center border-b border-slate-100">
                    <img src={product.thumbnail || (product.images && product.images[0])} alt={product.title} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="p-3 md:p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-xs md:text-sm text-slate-800 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors mb-2">{product.title}</h3>
                    <div className="mt-auto">
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-xs font-bold text-slate-500">৳</span>
                        <p className="font-black text-orange-600 text-lg md:text-xl">{product.price.toLocaleString('en-IN')}</p>
                      </div>
                      <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-2 rounded-full text-[10px] md:text-xs transition-colors shadow-sm uppercase tracking-wider">
                        View Details
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-10 md:p-16 text-center border border-slate-200 flex flex-col items-center justify-center mt-10">
              <span className="text-5xl mb-4">🛒</span>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No items found</h3>
              <p className="text-slate-500 text-sm">There are no products in this category yet.</p>
              <button onClick={() => handleCategorySelect(null)} className="mt-6 font-bold text-orange-600 hover:text-orange-700 underline text-sm">Back to all products</button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Home;