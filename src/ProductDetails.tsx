import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ID } from 'appwrite';
// 🔴 শুধু account ইমপোর্ট করা হয়েছে অটো-ফিলের জন্য
import { databases, account, DATABASE_ID, PRODUCT_COLLECTION_ID, REQUEST_COLLECTION_ID, CATEGORY_COLLECTION_ID } from './appwrite';

function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [mainImage, setMainImage] = useState<string>('');
  const [viewFullScreen, setViewFullScreen] = useState<string | null>(null);
  const [catNameStr, setCatNameStr] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryArea, setDeliveryArea] = useState<'inside' | 'outside'>('inside');
  const [formData, setFormData] = useState({
    name: '', phone: '', address: '', profession: '', businessType: ''
  });

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await databases.getDocument(DATABASE_ID, PRODUCT_COLLECTION_ID, id as string);
        setProduct(response);
        
        if (response.images && response.images.length > 0) {
          setMainImage(response.images[0]);
        } else {
          setMainImage(response.thumbnail || '');
        }

        let fetchedCatName = '';
        const catData = response.categories;
        if (typeof catData === 'string') {
           try {
              const catDoc = await databases.getDocument(DATABASE_ID, CATEGORY_COLLECTION_ID, catData);
              fetchedCatName = catDoc.name;
           } catch(e) { console.error("Category fetch error", e); }
        } else if (Array.isArray(catData)) {
           fetchedCatName = catData[0]?.name || '';
        } else if (catData?.name) {
           fetchedCatName = catData.name;
        }
        setCatNameStr(fetchedCatName.toLowerCase());

      } catch (error) {
        console.error("ডাটা আনতে সমস্যা হয়েছে:", error);
      } finally {
        setLoading(false);
      }
    };

    // 🔴 ম্যাজিক: কাস্টমার লগইন করা থাকলে তার নাম অটো-ফিল করে দেবে!
    const fetchLoggedInUser = async () => {
      try {
        const user = await account.get();
        setFormData(prev => ({ ...prev, name: user.name }));
      } catch (error) {
        console.log("Customer is not logged in.");
      }
    };

    if (id) fetchProductDetails();
    fetchLoggedInUser(); // ইউজার ফেচ কল করা হলো
  }, [id]);

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-slate-50"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center font-bold text-3xl">প্রোডাক্টটি খুঁজে পাওয়া যায়নি!</div>;

  let actionType = 'order'; 
  let buttonText = 'অর্ডার করুন';
  let deliveryCharge = deliveryArea === 'inside' ? 60 : 120; 

  if (catNameStr.includes('apartment') || catNameStr.includes('এপার্টমেন্ট') || catNameStr.includes('flat') || catNameStr.includes('ফ্ল্যাট') || catNameStr.includes('real estate')) {
    actionType = 'booking';
    buttonText = 'এখনই বুকিং দিন';
  } else if (catNameStr.includes('software') || catNameStr.includes('সফটওয়্যার') || catNameStr.includes('সফটওয়্যার')) {
    actionType = 'contact';
    buttonText = 'কন্ট্যাক্ট করুন';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const extraInfo = actionType === 'order' 
      ? `ডেলিভারি এরিয়া: ${deliveryArea === 'inside' ? 'ঢাকার ভেতরে' : 'ঢাকার বাইরে'}` 
      : `পেশা: ${formData.profession || 'N/A'}, ব্যবসার ধরন: ${formData.businessType || 'N/A'}`;
      
    const totalPrice = actionType === 'order' ? product.price + deliveryCharge : product.price;

    try {
      await databases.createDocument(DATABASE_ID, REQUEST_COLLECTION_ID, ID.unique(), {
        customer_name: formData.name,
        phone: formData.phone,
        address: formData.address,
        request_type: actionType, 
        product_name: product.title,
        extra_info: extraInfo,
        total_price: totalPrice
      });
      
      alert(`ধন্যবাদ ${formData.name}! আপনার ${buttonText} সফলভাবে সম্পন্ন হয়েছে। আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।`);
      setIsModalOpen(false);
      
      // 🔴 সাবমিট করার পর যাতে নামটা আবার অটো-ফিল থেকে যায়, তাই নামটা রেখে বাকিগুলো ক্লিয়ার করা হলো
      setFormData(prev => ({ ...prev, phone: '', address: '', profession: '', businessType: '' }));
      setDeliveryArea('inside');
    } catch (error: any) {
      console.error(error);
      alert(`দুঃখিত, সাবমিট করতে সমস্যা হয়েছে। দয়া করে Appwrite চেক করুন।`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-6 px-4 sm:px-6 lg:px-12 font-sans relative">
      <div className="max-w-[1400px] mx-auto">
        
        <Link to="/" className="inline-flex items-center text-slate-500 hover:text-indigo-600 font-medium mb-6 transition-colors text-sm">
          <span className="mr-2">←</span> পূর্বের পেজে ফিরে যান
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          <div className="lg:col-span-5 flex flex-col md:flex-row gap-4 h-auto md:h-[500px]">
            {product.images && product.images.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto pb-2 md:pb-0 md:pr-2 w-full md:w-20 shrink-0 hide-scrollbar order-2 md:order-1">
                {product.images.map((imgUrl: string, index: number) => (
                  <img 
                    key={index} 
                    src={imgUrl} 
                    alt={`thumbnail-${index}`} 
                    onMouseEnter={() => setMainImage(imgUrl)} 
                    onClick={() => setMainImage(imgUrl)} 
                    className={`h-16 w-16 md:h-16 md:w-full object-cover rounded-md cursor-pointer transition-all border-2 flex-shrink-0 ${mainImage === imgUrl ? 'border-orange-500 shadow-sm' : 'border-slate-200 opacity-70 hover:opacity-100'}`} 
                  />
                ))}
              </div>
            )}

            <div className="flex-1 relative rounded-xl overflow-hidden bg-white flex items-center justify-center p-4 order-1 md:order-2 group border border-slate-100">
              <img src={mainImage} alt={product.title} onClick={() => setViewFullScreen(mainImage)} className="max-w-full max-h-full object-contain cursor-zoom-in" />
              <div className="absolute top-4 left-4 z-20"><span className="bg-indigo-600 text-white px-3 py-1 rounded text-xs font-bold uppercase shadow-sm">{catNameStr || 'Premium'}</span></div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col h-full py-2">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-snug mb-2">{product.title}</h1>
            
            <div className="border-b border-slate-200 pb-4 mb-4">
              <p className="text-sm font-medium text-slate-500 mb-1">Price</p>
              <div className="flex items-start gap-1">
                <span className="text-xl font-medium text-slate-800 mt-1">৳</span>
                <span className="text-4xl font-medium text-slate-900">{product.price.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-base font-bold text-slate-900 mb-2">About this item</h3>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-auto lg:w-2/3">
              <button onClick={() => setIsModalOpen(true)} className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-slate-900 px-8 py-3.5 rounded-full font-bold text-sm transition-all shadow-sm flex justify-center items-center gap-2">
                {buttonText}
              </button>
              {product.youtube_url && (
                <a href={product.youtube_url} target="_blank" rel="noreferrer" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-full font-bold text-sm transition-all shadow-sm flex justify-center items-center gap-2">
                  ভিডিও দেখুন
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-2xl font-black">{buttonText}</h3>
                <p className="text-indigo-200 text-sm mt-1">{product.title}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-red-300 font-bold text-2xl">✕</button>
            </div>

            <div className="p-8 overflow-y-auto">
              
              {actionType === 'order' && (
                <div className="bg-slate-50 p-5 rounded-2xl mb-6 border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-3 border-b pb-2">খরচের বিবরণ:</h4>
                  <div className="flex justify-between text-slate-600 mb-2"><span>প্রোডাক্টের দাম:</span> <span>৳ {product.price.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between text-slate-600 mb-2"><span>ডেলিভারি চার্জ:</span> <span>৳ {deliveryCharge}</span></div>
                  <div className="flex justify-between text-indigo-700 font-black text-xl mt-3 pt-3 border-t border-slate-200">
                    <span>সর্বমোট:</span> <span>৳ {(product.price + deliveryCharge).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {actionType === 'order' && (
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-3">কোথায় ডেলিভারি নিতে চান? *</label>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-3 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors flex-1">
                        <input type="radio" name="deliveryArea" value="inside" checked={deliveryArea === 'inside'} onChange={() => setDeliveryArea('inside')} className="w-4 h-4 accent-indigo-600 cursor-pointer" />
                        <span className="text-sm font-bold text-slate-700">ঢাকার ভেতরে (৳৬০)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-3 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors flex-1">
                        <input type="radio" name="deliveryArea" value="outside" checked={deliveryArea === 'outside'} onChange={() => setDeliveryArea('outside')} className="w-4 h-4 accent-indigo-600 cursor-pointer" />
                        <span className="text-sm font-bold text-slate-700">ঢাকার বাইরে (৳১২০)</span>
                      </label>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 mt-2">আপনার নাম *</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-slate-50" placeholder="নাম লিখুন" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ফোন নাম্বার *</label>
                  <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-slate-50" placeholder="01XXX-XXXXXX" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">বিস্তারিত ঠিকানা *</label>
                  <textarea required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-slate-50 h-24" placeholder="বাসা নং, রোড, এরিয়া..."></textarea>
                </div>

                {(actionType === 'booking' || actionType === 'contact') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">আপনার পেশা *</label>
                    <input type="text" required value={formData.profession} onChange={e => setFormData({...formData, profession: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-slate-50" placeholder="যেমন: ব্যবসায়ী / চাকরিজীবী" />
                  </div>
                )}

                {actionType === 'contact' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ব্যবসার ধরন *</label>
                    <input type="text" required value={formData.businessType} onChange={e => setFormData({...formData, businessType: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-slate-50" placeholder="যেমন: সুপারশপ / ফার্মেসি" />
                  </div>
                )}

                <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl mt-6 hover:bg-indigo-700 transition-all disabled:bg-indigo-300">
                  {isSubmitting ? 'সাবমিট হচ্ছে...' : 'কনফার্ম করুন'}
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {viewFullScreen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4" onClick={() => setViewFullScreen(null)}>
          <img src={viewFullScreen} alt="Enlarged" className="max-w-full max-h-[90vh] object-contain rounded-md" onClick={e => e.stopPropagation()} />
        </div>
      )}

    </div>
  );
}

export default ProductDetails;