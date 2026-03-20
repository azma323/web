import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Query, OAuthProvider } from 'appwrite'; // 🔴 গুগলের জন্য আনলাম
import { databases, account, DATABASE_ID, PRODUCT_COLLECTION_ID, CATEGORY_COLLECTION_ID } from './appwrite'; // 🔴 account আনলাম

function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSubCategoryId = searchParams.get('category');

  // 🔴 ম্যাজিক: কাস্টমারদের ডাইরেক্ট গুগল লগইন ফাংশন
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
        const res = await databases.listDocuments(DATABASE_ID, CATEGORY_COLLECTION_ID);
        setAllCategories(res.documents);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const queries = selectedSubCategoryId ? [Query.equal('categories', selectedSubCategoryId)] : [];
        const prodRes = await databases.listDocuments(DATABASE_ID, PRODUCT_COLLECTION_ID, queries);
        setProducts(prodRes.documents.reverse());
      } catch (error) {
        console.error("Products fetch error:", error);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [selectedSubCategoryId]);

  const mainCategories = allCategories.filter(c => !c.parent_id || c.parent_id === '');

  const handleMainCategoryClick = (mainCatId: string) => {
    if (expandedCategory === mainCatId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(mainCatId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      
      {/* 🌟 Header */}
      <header className="bg-slate-900 text-white py-4 px-4 md:px-8 flex items-center justify-between sticky top-0 z-50">
         <Link to="/" onClick={() => setSearchParams({})} className="text-3xl font-black text-orange-400 tracking-tighter">
            BDT
         </Link>
         
         <div className="hidden md:flex flex-1 max-w-3xl mx-8">
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full px-4 py-2.5 rounded-l-md outline-none text-slate-900" 
            />
            <button className="bg-orange-400 hover:bg-orange-500 transition-colors px-6 py-2.5 rounded-r-md font-bold text-slate-900">
              🔍
            </button>
         </div>

         {/* 🔴 আপডেট হওয়া মেনু: Contact, Customer Login, Admin */}
         <div className="flex items-center gap-4 md:gap-6">
           <Link to="/contact" className="font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-2">
             <span className="text-xl">📞</span> <span className="hidden md:inline">Contact</span>
           </Link>

           {/* 🛍️ কাস্টমার লগইন বাটন */}
           <button onClick={handleCustomerLogin} className="font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-2 border-l border-slate-700 pl-4 md:pl-6">
             <span className="text-xl">🛍️</span> <span className="hidden md:inline">Login</span>
           </button>

           {/* ⚙️ অ্যাডমিন লগইন লিংক */}
           <Link to="/login" className="font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-2 border-l border-slate-700 pl-4 md:pl-6">
             <span className="text-xl">⚙️</span> <span className="hidden md:inline">Admin</span>
           </Link>
         </div>
      </header>

      {/* 🌟 Main Content Area (Sidebar + Product Grid) */}
      <main className="flex flex-1 w-full max-w-[1500px] mx-auto overflow-hidden relative">
        <aside className="w-64 bg-white border-r border-slate-200 overflow-y-auto hidden md:block shrink-0 sticky top-[72px] h-[calc(100vh-72px)]">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Department</h3>
          </div>
          <ul className="py-2">
            <li className="px-4 py-1.5">
              <button 
                onClick={() => setSearchParams({})} 
                className={`w-full text-left text-sm font-medium hover:text-orange-600 transition-colors ${!selectedSubCategoryId ? 'text-orange-600 font-bold' : 'text-slate-700'}`}
              >
                All Products
              </button>
            </li>
            {mainCategories.map((mainCat) => {
              const subCats = allCategories.filter(c => c.parent_id === mainCat.$id);
              const isExpanded = expandedCategory === mainCat.$id;

              return (
                <li key={mainCat.$id} className="mt-1">
                  <button onClick={() => handleMainCategoryClick(mainCat.$id)} className="w-full text-left px-4 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <span className="text-sm font-bold text-slate-800 group-hover:text-orange-600 transition-colors">{mainCat.name}</span>
                    {subCats.length > 0 && <span className="text-xs text-slate-400 font-black">{isExpanded ? '−' : '+'}</span>}
                  </button>
                  {isExpanded && subCats.length > 0 && (
                    <ul className="bg-slate-50 py-2 border-l-2 border-orange-200 ml-4 pl-2 mr-4 rounded-br-lg">
                      {subCats.map((subCat) => (
                        <li key={subCat.$id}>
                          <button onClick={() => setSearchParams({ category: subCat.$id })} className={`w-full text-left px-3 py-1.5 text-sm transition-colors rounded-md ${selectedSubCategoryId === subCat.$id ? 'text-orange-600 font-bold bg-orange-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}>
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

        <section className="flex-1 p-6 lg:p-8 overflow-y-auto bg-slate-100">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
             <h2 className="text-xl md:text-2xl font-black text-slate-800">
               {selectedSubCategoryId ? allCategories.find(c => c.$id === selectedSubCategoryId)?.name || 'Search Results' : 'All Recommended Products'}
             </h2>
             {selectedSubCategoryId && (
               <button onClick={() => setSearchParams({})} className="text-sm font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-full transition-colors">
                 ✕ Clear Filter
               </button>
             )}
          </div>

          {loadingProducts ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500"></div></div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
              {products.map(product => (
                <Link to={`/product/${product.$id}`} key={product.$id} className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full">
                  <div className="aspect-square bg-white relative p-4 flex items-center justify-center border-b border-slate-100">
                    <img src={product.thumbnail || (product.images && product.images[0])} alt={product.title} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-sm text-slate-800 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors mb-2">{product.title}</h3>
                    <div className="mt-auto">
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-xs font-bold text-slate-500">৳</span>
                        <p className="font-black text-orange-600 text-xl">{product.price.toLocaleString('en-IN')}</p>
                      </div>
                      <button className="w-full mt-3 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-2 rounded-full text-xs transition-colors shadow-sm">
                        View Details
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-16 text-center border border-slate-200 flex flex-col items-center justify-center">
              <span className="text-5xl mb-4">🛒</span>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No items found</h3>
              <p className="text-slate-500">There are no products in this category yet.</p>
              <button onClick={() => setSearchParams({})} className="mt-6 font-bold text-orange-600 hover:text-orange-700 underline">Back to all products</button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Home;