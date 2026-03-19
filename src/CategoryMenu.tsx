import { useEffect, useState } from 'react';
import { databases, DATABASE_ID, CATEGORY_COLLECTION_ID } from './appwrite';
import { Link } from 'react-router-dom';

function CategoryMenu() {
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await databases.listDocuments(DATABASE_ID, CATEGORY_COLLECTION_ID);
        const docs = res.documents;
        setAllCategories(docs);

        // প্রথম মেইন ক্যাটাগরিটিকে ডিফল্টভাবে সিলেক্ট করে রাখা
        const mainCats = docs.filter(c => !c.parent_id || c.parent_id === '');
        if (mainCats.length > 0) {
          setActiveCategory(mainCats[0].$id);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // 🔴 ম্যাজিক লজিক: মেইন এবং সাব ক্যাটাগরি আলাদা করা
  const mainCategories = allCategories.filter(c => !c.parent_id || c.parent_id === '');
  const subCategories = allCategories.filter(c => c.parent_id === activeCategory);

  if (loading) {
    return (
      <div className="w-full max-w-[1200px] mx-auto bg-white rounded-xl shadow-lg border border-slate-200 flex h-[450px] items-center justify-center mt-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[1200px] mx-auto bg-white rounded-xl shadow-lg border border-slate-200 flex h-[450px] overflow-hidden font-sans mt-8">
      
      {/* 👈 বাম পাশ: মেইন ক্যাটাগরি লিস্ট */}
      <div className="w-64 bg-white border-r border-slate-100 overflow-y-auto py-3 shrink-0 hide-scrollbar">
        <h3 className="px-5 pb-3 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-2">
          All Categories
        </h3>
        <ul className="flex flex-col">
          {mainCategories.length > 0 ? mainCategories.map((category) => (
            <li 
              key={category.$id}
              onMouseEnter={() => setActiveCategory(category.$id)} 
              className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${
                activeCategory === category.$id 
                  ? 'bg-orange-50 text-orange-600 font-bold border-l-4 border-orange-500' 
                  : 'text-slate-600 hover:bg-slate-50 font-medium border-l-4 border-transparent'
              }`}
            >
              {/* আপাতত ডিফল্ট আইকন দিচ্ছি, পরে চাইলে ডাটাবেস থেকে আনতে পারবেন */}
              <span className="text-xl">📁</span> 
              <span className="text-sm truncate">{category.name}</span>
              <span className={`ml-auto text-xs ${activeCategory === category.$id ? 'text-orange-500' : 'text-slate-300'}`}>
                ▶
              </span>
            </li>
          )) : (
             <li className="px-5 py-3 text-sm text-slate-400">কোনো ক্যাটাগরি নেই</li>
          )}
        </ul>
      </div>

      {/* 👉 ডান পাশ: সাব-ক্যাটাগরি গ্রিড */}
      <div className="flex-1 bg-slate-50 p-8 overflow-y-auto">
        <h2 className="text-xl font-black text-slate-800 mb-6 border-b border-slate-200 pb-2">
          {mainCategories.find(c => c.$id === activeCategory)?.name || 'Sub Categories'}
        </h2>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-6">
          {subCategories.length > 0 ? subCategories.map((sub) => (
            <Link to={`/?category=${sub.$id}`} key={sub.$id} className="flex flex-col items-center group cursor-pointer">
              
              {/* 🔴 ট্রিক: সাব-ক্যাটাগরির ছবির ফিল্ড না থাকায় নামের প্রথম অক্ষর দিয়ে সুন্দর ছবি তৈরি করা হলো */}
              <div className="w-20 h-20 rounded-full bg-white shadow-sm border border-slate-200 overflow-hidden mb-3 group-hover:shadow-md group-hover:border-orange-300 transition-all flex items-center justify-center p-1">
                <img 
                  src={`https://ui-avatars.com/api/?name=${sub.name}&background=random&color=fff&size=150`} 
                  alt={sub.name} 
                  className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              
              <p className="text-xs font-bold text-slate-600 text-center group-hover:text-orange-600 transition-colors line-clamp-2">
                {sub.name}
              </p>
            </Link>
          )) : (
            <div className="col-span-full flex flex-col items-center justify-center py-10 opacity-50">
              <span className="text-4xl mb-2">📭</span>
              <p className="text-sm font-bold text-slate-500">এই ক্যাটাগরিতে কোনো সাব-ক্যাটাগরি নেই</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default CategoryMenu;