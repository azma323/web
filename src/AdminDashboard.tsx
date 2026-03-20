import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ID } from 'appwrite';
import { databases, account, storage, DATABASE_ID, PRODUCT_COLLECTION_ID, CATEGORY_COLLECTION_ID, REQUEST_COLLECTION_ID, BUCKET_ID } from './appwrite';

interface Product {
  $id: string; title: string; price: number; description?: string;
  thumbnail?: string; images?: string[]; youtube_url?: string; categories: any;
}

interface RequestItem {
  $id: string; customer_name: string; phone: string; address: string;
  request_type: string; product_name: string; extra_info: string;
  total_price: number; $createdAt: string;
}

const cropAndCompressImage = async (file: File, targetSize = 1000, quality = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');

        const size = Math.min(img.width, img.height);
        const xOffset = (img.width - size) / 2;
        const yOffset = (img.height - size) / 2;

        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetSize, targetSize);
          ctx.drawImage(img, xOffset, yOffset, size, size, 0, 0, targetSize, targetSize);
        }

        canvas.toBlob((blob) => {
          if (blob) {
            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg', lastModified: Date.now() });
            resolve(newFile);
          } else {
            reject(new Error('Canvas to Blob failed'));
          }
        }, 'image/jpeg', quality);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};


function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [catName, setCatName] = useState('');
  const [catParentId, setCatParentId] = useState(''); 
  
  const [pTitle, setPTitle] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pYoutube, setPYoutube] = useState('');
  const [pCatId, setPCatId] = useState('');
  
  // 🔴 ম্যাজিক: এখন এটি আর FileList নেই, এটি একটি Array হয়ে গেছে যাতে ছবি জমিয়ে রাখা যায়
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fetchData = async () => {
    try {
      const [catRes, prodRes, reqRes] = await Promise.all([
        databases.listDocuments(DATABASE_ID, CATEGORY_COLLECTION_ID),
        databases.listDocuments(DATABASE_ID, PRODUCT_COLLECTION_ID),
        databases.listDocuments(DATABASE_ID, REQUEST_COLLECTION_ID)
      ]);
      setCategories(catRes.documents);
      setProducts(prodRes.documents as unknown as Product[]);
      setRequests((reqRes.documents as unknown as RequestItem[]).reverse());
    } catch (error) { console.error("Fetch Error:", error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
    } catch (error) { 
      console.log("No active session found."); 
    }
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('/'); 
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return alert("Category name required!");
    try {
      await databases.createDocument(DATABASE_ID, CATEGORY_COLLECTION_ID, ID.unique(), { 
        name: catName, slug: catName.toLowerCase().replace(/\s+/g, '-'), parent_id: catParentId 
      });
      setCatName(''); setCatParentId(''); fetchData();
    } catch (error: any) { alert(`Error: ${error.message}`); }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pTitle || !pPrice || !pCatId) return alert("Fields required!");
    setIsUploading(true);
    try {
      const uploadedImageUrls: string[] = [];
      if (imageFiles && imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          const originalFile = imageFiles[i];
          const processedFile = await cropAndCompressImage(originalFile); 
          const uploadedFile = await storage.createFile(BUCKET_ID, ID.unique(), processedFile);
          const fileUrl = storage.getFileView(BUCKET_ID, uploadedFile.$id).toString();
          uploadedImageUrls.push(fileUrl);
        }
      }

      const productData: any = { title: pTitle, price: Number(pPrice), description: pDesc, youtube_url: pYoutube, categories: pCatId };
      if (uploadedImageUrls.length > 0) { productData.images = uploadedImageUrls; productData.thumbnail = uploadedImageUrls[0]; }

      if (editingId) {
        await databases.updateDocument(DATABASE_ID, PRODUCT_COLLECTION_ID, editingId, productData);
        alert("Updated Successfully! 🎉");
      } else {
        await databases.createDocument(DATABASE_ID, PRODUCT_COLLECTION_ID, ID.unique(), productData);
        alert("Published Successfully! 🎉");
      }
      cancelEdit(); fetchData();
    } catch (error: any) { alert(`Error: ${error.message}`); } 
    finally { setIsUploading(false); }
  };

  const handleEditClick = (product: Product) => {
    setEditingId(product.$id); setPTitle(product.title); setPPrice(product.price.toString());
    setPDesc(product.description || ''); setPYoutube(product.youtube_url || '');
    const catId = Array.isArray(product.categories) ? product.categories[0]?.$id : (product.categories?.$id || product.categories);
    setPCatId(catId); window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const cancelEdit = () => {
    setEditingId(null); setPTitle(''); setPPrice(''); setPDesc(''); setPYoutube(''); setPCatId(''); setImageFiles([]);
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleDelete = async (colId: string, docId: string) => {
    if (!window.confirm("Are you sure? This will be permanently deleted.")) return;
    try { await databases.deleteDocument(DATABASE_ID, colId, docId); fetchData(); } 
    catch (error: any) { alert(`Delete failed: ${error.message}`); } 
  };

  const handleMarkAsDone = async (docId: string, currentType: string) => {
    try {
      await databases.updateDocument(DATABASE_ID, REQUEST_COLLECTION_ID, docId, {
        request_type: currentType + '_done' 
      });
      fetchData();
    } catch (error: any) {
      alert(`Failed to mark as done: ${error.message}`);
    }
  };

  const handleDeleteCustomer = async (phone: string) => {
    if (!window.confirm("সতর্কতা: আপনি কি নিশ্চিত? এই কাস্টমারকে ডিলিট করলে তার করা সমস্ত অর্ডার এবং মেসেজও ডিলিট হয়ে যাবে!")) return;
    
    try {
      const customerRequests = requests.filter(r => r.phone === phone);
      await Promise.all(customerRequests.map(r => 
        databases.deleteDocument(DATABASE_ID, REQUEST_COLLECTION_ID, r.$id)
      ));
      fetchData(); 
    } catch (error: any) { 
      alert(`Delete failed: ${error.message}`); 
    } 
  };

  const pendingRequests = requests.filter(r => !r.request_type.endsWith('_done')); 
  
  const uniqueCustomers = Array.from(
    requests.reduce((map, r) => {
      if (r.phone && r.customer_name) {
        if (!map.has(r.phone)) {
          map.set(r.phone, { name: r.customer_name, phone: r.phone, address: r.address, totalOrders: 1, totalSpent: r.total_price, lastActive: r.$createdAt });
        } else {
          const existing = map.get(r.phone);
          existing.totalOrders += 1;
          existing.totalSpent += r.total_price;
          if (new Date(r.$createdAt) > new Date(existing.lastActive)) existing.lastActive = r.$createdAt;
        }
      }
      return map;
    }, new Map()).values()
  );

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-900">
      
      {/* 🌟 Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20 hidden md:flex">
        <div className="p-8 border-b border-slate-800">
          <h2 className="text-2xl font-black tracking-tighter text-orange-500 uppercase">BDT Admin</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-6">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left px-4 py-3.5 rounded-xl font-semibold transition-all flex items-center gap-3 ${activeTab === 'dashboard' ? 'bg-orange-500 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}><span>📊</span> Dashboard</button>
          
          <button onClick={() => setActiveTab('requests')} className={`w-full text-left px-4 py-3.5 rounded-xl font-semibold transition-all flex items-center gap-3 ${activeTab === 'requests' ? 'bg-orange-500 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
            <span>🔔</span> Orders & Messages 
            {pendingRequests.length > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-1 rounded-full font-black">{pendingRequests.length}</span>}
          </button>
          
          <button onClick={() => setActiveTab('customers')} className={`w-full text-left px-4 py-3.5 rounded-xl font-semibold transition-all flex items-center gap-3 ${activeTab === 'customers' ? 'bg-orange-500 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
            <span>👥</span> Customers 
            <span className="ml-auto bg-slate-700 text-slate-300 text-[10px] px-2 py-1 rounded-full font-black">{uniqueCustomers.length}</span>
          </button>
          
          <button onClick={() => setActiveTab('categories')} className={`w-full text-left px-4 py-3.5 rounded-xl font-semibold transition-all flex items-center gap-3 ${activeTab === 'categories' ? 'bg-orange-500 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}><span>📁</span> Categories</button>
          <button onClick={() => setActiveTab('products')} className={`w-full text-left px-4 py-3.5 rounded-xl font-semibold transition-all flex items-center gap-3 ${activeTab === 'products' ? 'bg-orange-500 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}><span>📦</span> Products</button>
        </nav>
        
        <div className="p-6 border-t border-slate-800 space-y-4">
          <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl font-black transition-all flex items-center gap-3">
            <span className="text-xl">🚪</span> LOGOUT
          </button>
          <Link to="/" className="text-slate-400 hover:text-white text-sm font-bold flex items-center gap-2"><span>←</span> Back to Site</Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white h-20 shadow-sm border-b border-slate-200 flex items-center justify-between px-10">
          <h1 className="text-2xl font-black text-slate-800 capitalize tracking-tight">{activeTab}</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-10">
          {loading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div></div>
          ) : (
            <>
              {/* ... (Dashboard, Requests, Customers, Categories Tabs remain identical) ... */}
              {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Products</p>
                    <h2 className="text-5xl font-black">{products.length}</h2>
                  </div>
                  <div className="bg-orange-500 text-white p-8 rounded-3xl shadow-lg border border-orange-400">
                    <p className="text-xs font-bold text-orange-200 uppercase mb-1">New Pending Orders</p>
                    <h2 className="text-5xl font-black">{pendingRequests.length}</h2>
                  </div>
                  <div className="bg-slate-800 text-white p-8 rounded-3xl shadow-lg border border-slate-700">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Active Customers</p>
                    <h2 className="text-5xl font-black">{uniqueCustomers.length}</h2>
                  </div>
                </div>
              )}

              {activeTab === 'requests' && (
                <div className="space-y-6">
                  <h3 className="font-black text-xl text-slate-800 mb-6 flex items-center gap-2"><span>🔔</span> New Orders & Messages</h3>
                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b"><tr className="text-[10px] font-black uppercase text-slate-400"><th className="p-6">Type & Date</th><th className="p-6">Customer Info</th><th className="p-6">Details / Message</th><th className="p-6 text-right">Actions</th></tr></thead>
                      <tbody>
                        {pendingRequests.map(r => (
                          <tr key={r.$id} className="border-b hover:bg-slate-50 transition-colors">
                            <td className="p-6">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${r.request_type === 'booking' ? 'bg-blue-100 text-blue-700' : r.request_type === 'order' ? 'bg-emerald-100 text-emerald-700' : r.request_type === 'message' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                                {r.request_type}
                              </span>
                              <p className="text-xs text-slate-500 mt-3 font-bold">{new Date(r.$createdAt).toLocaleDateString('en-GB')}</p>
                            </td>
                            <td className="p-6">
                              <p className="font-black text-slate-800 text-lg">{r.customer_name}</p>
                              <p className="font-bold text-slate-600 mt-1 flex items-center gap-1">📞 {r.phone}</p>
                              {r.request_type !== 'message' && <p className="text-xs text-slate-500 mt-2 font-medium bg-slate-100 p-2 rounded-lg inline-block">{r.address}</p>}
                            </td>
                            <td className="p-6">
                              <p className="font-bold text-slate-800">{r.product_name}</p>
                              {r.total_price > 0 && <p className="font-black text-emerald-600 mt-2">Total Bill: ৳{r.total_price.toLocaleString('en-IN')}</p>}
                              {r.extra_info && r.extra_info !== 'পেশা: N/A, ব্যবসার ধরন: N/A' && <p className="text-xs text-slate-600 mt-2 border-l-2 border-orange-300 pl-3 whitespace-pre-wrap bg-orange-50/50 p-2 rounded-r-lg">{r.extra_info}</p>}
                            </td>
                            <td className="p-6 text-right space-x-2 whitespace-nowrap">
                              <button onClick={() => handleMarkAsDone(r.$id, r.request_type)} className="bg-emerald-50 text-emerald-600 font-black border border-emerald-200 hover:bg-emerald-600 hover:text-white px-4 py-2 rounded-lg transition-colors text-xs shadow-sm">✅ Mark Done</button>
                              <button onClick={() => handleDelete(REQUEST_COLLECTION_ID, r.$id)} className="bg-white text-red-500 font-bold border border-red-200 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors text-xs">🗑️ Delete</button>
                            </td>
                          </tr>
                        ))}
                        {pendingRequests.length === 0 && <tr><td colSpan={4} className="p-10 text-center font-bold text-slate-400">No new pending orders right now!</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'customers' && (
                <div className="space-y-6">
                  <h3 className="font-black text-xl text-slate-800 mb-6 flex items-center gap-2"><span>👥</span> Customer Directory</h3>
                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b"><tr className="text-[10px] font-black uppercase text-slate-400"><th className="p-6">Customer Name & Phone</th><th className="p-6">Delivery Address</th><th className="p-6">Total Orders & Spent</th><th className="p-6 text-right">Action</th></tr></thead>
                      <tbody>
                        {uniqueCustomers.map((c: any, idx) => (
                          <tr key={idx} className="border-b hover:bg-slate-50 transition-colors">
                            <td className="p-6">
                              <p className="font-black text-slate-800 text-lg">{c.name}</p>
                              <p className="font-bold text-orange-600 mt-1 flex items-center gap-1">📞 {c.phone}</p>
                            </td>
                            <td className="p-6">
                              <p className="text-sm text-slate-600 font-medium max-w-xs">{c.address || 'N/A'}</p>
                            </td>
                            <td className="p-6">
                              <p className="font-black text-slate-800"><span className="text-slate-400">Orders/Msgs:</span> {c.totalOrders}</p>
                              <p className="font-black text-emerald-600 mt-1"><span className="text-slate-400">Spent:</span> ৳{c.totalSpent.toLocaleString('en-IN')}</p>
                            </td>
                            <td className="p-6 text-right">
                               <p className="text-xs font-bold text-slate-400 mb-3">Last Active: {new Date(c.lastActive).toLocaleDateString('en-GB')}</p>
                               <button onClick={() => handleDeleteCustomer(c.phone)} className="text-red-500 font-bold hover:bg-red-50 px-3 py-2 rounded-md transition-colors border border-red-100 hover:border-red-300 text-xs">🗑️ Delete Customer</button>
                            </td>
                          </tr>
                        ))}
                        {uniqueCustomers.length === 0 && <tr><td colSpan={4} className="p-10 text-center font-bold text-slate-400">No active customers found yet!</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'categories' && ( 
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                 <div className="bg-white p-8 rounded-3xl border border-slate-200 h-fit">
                   <h3 className="font-black text-lg mb-6">Create Category</h3>
                   <form onSubmit={handleAddCategory} className="space-y-4">
                     <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Category Name</label>
                       <input type="text" value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. Electronics or Mobile" className="w-full px-5 py-3 rounded-xl border-2 border-slate-100 focus:border-orange-500 outline-none" required/>
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Parent Category (Optional)</label>
                       <select value={catParentId} onChange={(e) => setCatParentId(e.target.value)} className="w-full px-5 py-3 rounded-xl border-2 border-slate-100 outline-none bg-white focus:border-orange-500">
                         <option value="">None (Make it a Main Category)</option>
                         {categories.filter(c => !c.parent_id).map(cat => (
                           <option key={cat.$id} value={cat.$id}>{cat.name}</option>
                         ))}
                       </select>
                     </div>
                     <button className="w-full bg-slate-900 hover:bg-orange-500 transition-colors text-white py-4 rounded-xl font-black mt-2">SAVE CATEGORY</button>
                   </form>
                 </div>
                 <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 overflow-hidden">
                   <table className="w-full text-left">
                     <thead className="bg-slate-50 border-b"><tr className="text-[10px] font-black uppercase text-slate-400"><th className="p-6">Category Name</th><th className="p-6 text-right">Action</th></tr></thead>
                     <tbody>
                       {categories.map(c => (
                         <tr key={c.$id} className="border-b">
                           <td className="p-6 font-bold flex items-center gap-2">
                             {c.name}
                             {c.parent_id && <span className="bg-orange-50 text-orange-600 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-widest border border-orange-100">Sub of: {categories.find(p => p.$id === c.parent_id)?.name || 'Unknown'}</span>}
                           </td>
                           <td className="p-6 text-right"><button onClick={() => handleDelete(CATEGORY_COLLECTION_ID, c.$id)} className="text-red-500 font-bold hover:bg-red-50 px-3 py-1 rounded-md">Delete</button></td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
              )}

              {/* Products Tab */}
              {activeTab === 'products' && (
                <div className="space-y-10">
                  <div className={`p-10 rounded-3xl border shadow-sm transition-all ${editingId ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black text-xl text-slate-800">{editingId ? '✏️ Update Listing' : '➕ Add New Listing'}</h3>
                      {editingId && <button onClick={cancelEdit} className="text-sm font-bold text-slate-500 hover:text-red-500">Cancel Edit</button>}
                    </div>

                    <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <input type="text" value={pTitle} onChange={(e) => setPTitle(e.target.value)} placeholder="Title / Name" className="px-5 py-4 rounded-xl border-2 border-slate-100 outline-none focus:border-orange-500 bg-white" required/>
                      <input type="number" value={pPrice} onChange={(e) => setPPrice(e.target.value)} placeholder="Price (৳)" className="px-5 py-4 rounded-xl border-2 border-slate-100 outline-none focus:border-orange-500 bg-white" required/>
                      
                      <select value={pCatId} onChange={(e) => setPCatId(e.target.value)} className="px-5 py-4 rounded-xl border-2 border-slate-100 outline-none bg-white focus:border-orange-500" required>
                        <option value="">Select Category</option>
                        {categories.map(cat => <option key={cat.$id} value={cat.$id}>{cat.name}</option>)}
                      </select>
                      
                      <input type="text" value={pYoutube} onChange={(e) => setPYoutube(e.target.value)} placeholder="YouTube Video URL (Optional)" className="px-5 py-4 rounded-xl border-2 border-slate-100 outline-none focus:border-orange-500 bg-white" />
                      
                      {/* 🔴 আপডেট হওয়া ছবি সিলেক্ট এবং লাইভ প্রিভিউ সেকশন */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                          Upload Images (Select one by one or multiple) {editingId && <span className="text-orange-500 lowercase normal-case">- leave empty to keep existing</span>}
                        </label>
                        <input 
                          id="image-upload" 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          onChange={(e) => {
                            if (e.target.files) {
                              const newFiles = Array.from(e.target.files);
                              setImageFiles(prev => [...prev, ...newFiles]); // লিস্টে নতুনগুলো যোগ হবে
                              e.target.value = ''; // ইনপুট ক্লিয়ার, যাতে একই ছবি চাইলে আবার সিলেক্ট করা যায়
                            }
                          }} 
                          className="w-full px-5 py-4 rounded-xl border-2 border-slate-100 outline-none focus:border-orange-500 bg-white cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100" 
                        />

                        {/* 🖼️ ছবির লাইভ প্রিভিউ এবং ডিলিট করার অপশন */}
                        {imageFiles.length > 0 && (
                          <div className="flex gap-4 flex-wrap mt-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                            {imageFiles.map((file, idx) => (
                              <div key={idx} className="relative w-24 h-24 border-2 border-slate-200 rounded-xl overflow-hidden group shadow-sm bg-white">
                                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                                <button 
                                  type="button" 
                                  onClick={() => setImageFiles(prev => prev.filter((_, i) => i !== idx))} 
                                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-all shadow-md"
                                  title="Remove Image"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <textarea value={pDesc} onChange={(e) => setPDesc(e.target.value)} placeholder="Detailed Description..." className="md:col-span-2 px-5 py-4 rounded-xl border-2 border-slate-100 outline-none focus:border-orange-500 bg-white min-h-[120px]" />
                      
                      <div className="md:col-span-2 flex gap-4">
                        <button type="submit" disabled={isUploading} className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 transition-all text-white font-black py-5 rounded-xl shadow-lg flex justify-center items-center gap-2">
                          {isUploading ? 'CROPPING & SAVING...' : (editingId ? 'UPDATE LISTING' : 'PUBLISH LISTING')}
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b"><tr className="text-[10px] font-black uppercase text-slate-400"><th className="p-6">Details</th><th className="p-6">Images</th><th className="p-6 text-right">Action</th></tr></thead>
                      <tbody>
                        {products.map(p => (
                          <tr key={p.$id} className={`border-b hover:bg-slate-50 transition-colors ${editingId === p.$id ? 'bg-orange-50/50' : ''}`}>
                            <td className="p-6">
                              <p className="font-bold text-lg text-slate-800">{p.title}</p>
                              <p className="font-black text-orange-600 mt-1">৳{p.price.toLocaleString()}</p>
                            </td>
                            <td className="p-6">
                               <div className="flex gap-2 flex-wrap max-w-[200px]">
                                  {p.images && p.images.length > 0 ? p.images.map((imgUrl, idx) => (
                                    <img key={idx} src={imgUrl} alt="thumb" onClick={() => setViewImage(imgUrl)} className="w-12 h-12 rounded-lg object-cover border border-slate-200 cursor-pointer hover:opacity-80" />
                                  )) : <span className="text-xs text-slate-400">No images</span>}
                               </div>
                            </td>
                            <td className="p-6 text-right space-x-3 whitespace-nowrap">
                              <button onClick={() => handleEditClick(p)} className="text-blue-600 font-bold hover:bg-blue-50 px-3 py-2 rounded-md transition-colors">Edit</button>
                              <button onClick={() => handleDelete(PRODUCT_COLLECTION_ID, p.$id)} className="text-red-500 font-bold hover:bg-red-50 px-3 py-2 rounded-md transition-colors">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {viewImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/90 p-4" onClick={() => setViewImage(null)}>
          <img src={viewImage} alt="Enlarged view" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;