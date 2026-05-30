import { Link } from 'react-router-dom';

interface CategoryRowSliderProps {
  categoryName: string;
  products: any[];
}

export default function CategoryRowSlider({ categoryName, products }: CategoryRowSliderProps) {
  
  if (!products || products.length === 0) return null;

  return (
    <div className="mb-10 w-full">
      <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
        <span className="w-2 h-6 bg-orange-500 rounded-full inline-block"></span>
        {categoryName}
      </h2>
      
      <div className="relative w-full py-2">
        {/* 🔴 ম্যাজিক রেসপনসিভ লজিক:
          - ফোনে (Default): 'flex' এবং 'overflow-x-auto' যা সব প্রোডাক্টকে এক লাইনে রেখে ডানে-বামে সোয়াইপ/স্লাইড করার সুবিধা দেবে।
          - ডেস্কটপে (md:): 'md:grid' এবং 'md:grid-cols-4' যা প্রতি লাইনে ৪টি প্রোডাক্ট ফিক্সড করে দেবে এবং ৫ নম্বর থেকে পরের লাইনে পাঠাবে।
        */}
        <div className="flex md:grid md:grid-cols-4 gap-3 lg:gap-6 w-full overflow-x-auto md:overflow-x-visible snap-x snap-mandatory pb-4 md:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {products.map(product => (
            <Link 
              to={`/product/${product.$id}`} 
              key={product.$id} 
              // ফোনে কার্ডের সাইজ নির্দিষ্ট থাকবে (w-[165px]) যেন স্ক্রল করা যায়। 
              // ডেস্কটপে (md:) এটি গ্রিডের পুরো জায়গা (md:w-full) নিয়ে নিবে।
              className="w-[165px] sm:w-[200px] md:w-full shrink-0 md:shrink snap-start bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full"
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