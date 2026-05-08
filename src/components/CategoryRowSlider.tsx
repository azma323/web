import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface CategoryRowSliderProps {
  categoryName: string;
  products: any[];
  rowIndex: number;
}

export default function CategoryRowSlider({ categoryName, products, rowIndex }: CategoryRowSliderProps) {
  const [animState, setAnimState] = useState<'idle' | 'sliding-out' | 'hidden-left'>('idle');

  useEffect(() => {
    // 🔴 সিরিয়াল অনুযায়ী অ্যানিমেশন: 
    // প্রথম সারি ০ সেকেন্ড, দ্বিতীয় সারি ৫ সেকেন্ড, তৃতীয় সারি ১০ সেকেন্ড পর অ্যানিমেট হবে
    const delay = rowIndex * 5000; 
    
    const timer = setTimeout(() => {
      triggerAnimation();

      // এরপর প্রতি ১৫ সেকেন্ড পর পর এটি লুপ হতে থাকবে
      const interval = setInterval(() => {
        triggerAnimation();
      }, 15000);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [rowIndex]);

  const triggerAnimation = () => {
    setAnimState('sliding-out'); // ডানে স্লাইড হয়ে বের হবে
    setTimeout(() => {
      setAnimState('hidden-left'); // বামে লুকিয়ে যাবে
      setTimeout(() => {
        setAnimState('idle'); // বাম থেকে আবার আগের জায়গায় ঢুকবে
      }, 50);
    }, 1000);
  };

  let transformClass = 'translate-x-0 opacity-100 transition-all duration-1000 ease-in-out';
  if (animState === 'sliding-out') {
    transformClass = 'translate-x-[120%] opacity-0 transition-all duration-1000 ease-in-out'; 
  } else if (animState === 'hidden-left') {
    transformClass = '-translate-x-[120%] opacity-0 transition-none'; 
  }

  if (!products || products.length === 0) return null;

  return (
    <div className="mb-10 overflow-hidden">
      <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
        <span className="w-2 h-6 bg-orange-500 rounded-full inline-block"></span>
        {categoryName}
      </h2>
      
      <div className="relative overflow-hidden w-full py-2">
        <div className={`flex gap-3 lg:gap-6 w-full ${transformClass}`}>
          {products.map(product => (
            <Link 
              to={`/product/${product.$id}`} 
              key={product.$id} 
              // 🔴 ম্যাজিক ফিক্স: এখানে ফিক্সড Width দেওয়া হয়েছে, ফলে আর জুম হবে না। আগের গ্রিডের মতো সাইজ থাকবে।
              className="w-[160px] sm:w-[200px] md:w-[220px] lg:w-[240px] xl:w-[260px] shrink-0 bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full"
            >
              <div className="aspect-square bg-white relative p-2 md:p-4 flex items-center justify-center border-b border-slate-100">
                <img 
                  src={product.thumbnail || (product.images && product.images[0]) || 'https://placehold.co/400x400/f8fafc/f97316?text=No+Image'} 
                  alt={product.title} 
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/f8fafc/f97316?text=No+Image'; }}
                  className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" 
                />
              </div>
              <div className="p-3 md:p-4 flex flex-col flex-1">
                <h3 className="font-bold text-xs md:text-sm text-slate-800 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors mb-2">
                  {product.title}
                </h3>
                <div className="mt-auto">
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-xs font-bold text-slate-500">৳</span>
                    <p className="font-black text-orange-600 text-lg md:text-xl">{product.price?.toLocaleString('en-IN')}</p>
                  </div>
                  <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-2 rounded-full text-[10px] md:text-xs transition-colors shadow-sm uppercase tracking-wider">
                    View Details
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}