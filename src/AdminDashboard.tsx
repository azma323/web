import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ID } from 'appwrite';
import { databases, account, storage, DATABASE_ID, PRODUCT_COLLECTION_ID, CATEGORY_COLLECTION_ID, REQUEST_COLLECTION_ID, BUCKET_ID } from './appwrite';

// 🌟 Types
interface Product {
  $id: string;
  title: string;
  price: number;
  description?: string;
  thumbnail?: string;
  images?: string[]; 
  youtube_url?: string;
  categories: any;
}

interface RequestItem {
  $id: string;
  customer_name: string;
  phone: string;
  address: string;
  request_type: string;
  product_name: string;
  extra_info: string;
  total_price: number;
  $createdAt: string;
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // 🔴 নতুন স্টেট: ক্লায়েন্টের রিকোয়েস্ট রাখার জন্য
  const [requests, setRequests] = useState<RequestItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form States
  const [catName, setCatName] = useState('');
  const [pTitle, setPTitle] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pYoutube, setPYoutube] = useState('');
  const [pCatId, setPCatId] = useState('');
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 📥 ডাটা ফেচ করা
  const fetchData = async () => {
    try {
      const [catRes, prodRes, reqRes] = await Promise.all([
        databases.listDocuments(DATABASE_ID, CATEGORY_COLLECTION_ID),
        databases.listDocuments(DATABASE_ID, PRODUCT_COLLECTION_ID),
        databases.listDocuments(DATABASE_ID, REQUEST_COLLECTION_ID) // রিকোয়েস্ট ফেচ করা
      ]);
      setCategories(catRes.documents);
      setProducts(prodRes.documents as unknown as Product[]);
      
      // নতুন রিকোয়েস্টগুলো যেন সবার উপরে দেখায় তাই .reverse() করা হয়েছে
      setRequests((reqRes.documents as unknown as RequestItem[]).reverse());
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // 🚀 Bulletproof Logout Function
 const handleLogout = async () => {
    try {
      await account.deleteSession('current');
    } catch (error) { 
      // 404 আসলে কিছুই বলবে না, জাস্ট ইগনোর করবে
      console.log("No active session found."); 
    } finally {
      // পেজ না আটকে জোর করে লগইন পেজে পাঠিয়ে দেবে
      window.location.href = '/login'; 
    }
  };
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return alert("Category name is required!");
    try {
      await databases.createDocument(DATABASE_ID, CATEGORY_COLLECTION_ID, ID.unique(), { 
        name: catName, slug: catName.toLowerCase().replace(/\s+/g, '-') 
      });
      setCatName('');
      fetchData();
    } catch (error: any) { alert(`Category Error: ${error.message}`); }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pTitle || !pPrice || !pCatId) return alert("Title, Price & Category are required!");
    setIsUploading(true);
    try {
      const uploadedImageUrls: string[] = [];
      if (imageFiles && imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const uploadedFile = await storage.createFile(BUCKET_ID, ID.unique(), file);
          const fileUrl = storage.getFileView(BUCKET_ID, uploadedFile.$id).toString();
          uploadedImageUrls.push(fileUrl);
        }
      }

      const productData: any = {
        title: pTitle, price: Number(pPrice), description: pDesc,
        youtube_url: pYoutube, categories: pCatId
      };

      if (uploadedImageUrls.length > 0) {
         productData.images = uploadedImageUrls;
         productData.thumbnail = uploadedImageUrls[0];
      }

      if (editingId) {
        await databases.updateDocument(DATABASE_ID, PRODUCT_COLLECTION_ID, editingId, productData);
        alert("Product Updated Successfully! 🎉");
      } else {
        await databases.createDocument(DATABASE_ID, PRODUCT_COLLECTION_ID, ID.unique(), productData);
        alert("Product Published Successfully! 🎉");
      }
      
      cancelEdit();
      fetchData();
    } catch (error: any) { 
      console.error("Save Error:", error);
      alert(`Error saving product: ${error.message}`); 
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingId(product.$id); setPTitle(product.title); setPPrice(product.price.toString());
    setPDesc(product.description || ''); setPYoutube(product.youtube_url || '');
    const catId = Array.isArray(product.categories) ? product.categories[0]?.$id : (product.categories?.$id || product.categories);
    setPCatId(catId);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const cancelEdit = () => {
    setEditingId(null);
    setPTitle(''); setPPrice(''); setPDesc(''); setPYoutube(''); setPCatId(''); setImageFiles(null);
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleDelete = async (colId: string, docId: string) => {
    if (!window.confirm("Are you sure you want to delete this?")) return;
    try {
      await databases.deleteDocument(DATABASE_ID, colId, docId);
      fetchData();
    } catch (error: any) { alert(`Delete failed: ${error.message}`); } 
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-900">
      
      {/* 🌟 Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20 hidden md:flex">
        <div className="p-8 border-b border-slate-800">
          <h2 className="text-2xl font-black tracking-tighter text-indigo-400 uppercase">BDT Admin</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-6">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left px-4 py-3.5 rounded-xl font-semibold transition-all flex items-center gap-3 ${activeTab === 'dashboard' ? 'bg-indigo-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}><span>📊</span> Dashboard</button>
          
          {/* 🔴 নতুন Requests বাটন */}
          <button onClick={() => setActiveTab('requests')} className={`w-full text-left px-4 py-3.5 rounded-xl font-semibold transition-all flex items-center gap-3 ${activeTab === 'requests' ? 'bg-indigo-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
            <span>🔔</span> Orders & Requests 
            {requests.length > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-1 rounded-full font-black">{requests.length}</span>}
          </button>
          
          <button onClick={() => setActiveTab('categories')} className={`w-full text-left px-4 py-3.5 rounded-xl font-semibold transition-all flex items-center gap-3 ${activeTab === 'categories' ? 'bg-indigo-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}><span>📁</span> Categories</button>
          <button onClick={() => setActiveTab('products')} className={`w-full text-left px-4 py-3.5 rounded-xl font-semibold transition-all flex items-center gap-3 ${activeTab === 'products' ? 'bg-indigo-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}><span>📦</span> Products</button>
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
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Products</p>
                    <h2 className="text-5xl font-black">{products.length}</h2>
                  </div>
                  <div className="bg-indigo-600 text-white p-8 rounded-3xl shadow-lg border border-indigo-500">
                    <p className="text-xs font-bold text-indigo-200 uppercase mb-1">New Orders & Requests</p>
                    <h2 className="text-5xl font-black">{requests.length}</h2>
                  </div>
                </div>
              )}

              {/* 🌟 নতুন Requests Tab Content */}
              {activeTab === 'requests' && (
                <div className="space-y-6">
                  <h3 className="font-black text-xl text-slate-800 mb-6 flex items-center gap-2"><span>🔔</span> Customer Bookings & Orders</h3>
                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b"><tr className="text-[10px] font-black uppercase text-slate-400"><th className="p-6">Type & Date</th><th className="p-6">Customer Info</th><th className="p-6">Product Details</th><th className="p-6 text-right">Action</th></tr></thead>
                      <tbody>
                        {requests.map(r => (
                          <tr key={r.$id} className="border-b hover:bg-slate-50 transition-colors">
                            <td className="p-6">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                r.request_type === 'booking' ? 'bg-blue-100 text-blue-700' : 
                                r.request_type === 'order' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                              }`}>
                                {r.request_type}
                              </span>
                              <p className="text-xs text-slate-500 mt-3 font-bold">{new Date(r.$createdAt).toLocaleDateString('en-GB')}</p>
                            </td>
                            <td className="p-6">
                              <p className="font-black text-slate-800 text-lg">{r.customer_name}</p>
                              <p className="font-bold text-indigo-600 mt-1 flex items-center gap-1">📞 {r.phone}</p>
                              <p className="text-xs text-slate-500 mt-2 font-medium bg-slate-100 p-2 rounded-lg inline-block">{r.address}</p>
                            </td>
                            <td className="p-6">
                              <p className="font-bold text-slate-800">{r.product_name}</p>
                              {r.total_price > 0 && <p className="font-black text-emerald-600 mt-2">Total Bill: ৳{r.total_price.toLocaleString('en-IN')}</p>}
                              {r.extra_info && r.extra_info !== 'পেশা: N/A, ব্যবসার ধরন: N/A' && (
                                <p className="text-xs text-slate-500 mt-2 border-l-2 border-indigo-200 pl-2">{r.extra_info}</p>
                              )}
                            </td>
                            <td className="p-6 text-right">
                              <button onClick={() => handleDelete(REQUEST_COLLECTION_ID, r.$id)} className="text-red-500 font-bold hover:bg-red-50 px-3 py-2 rounded-md transition-colors border border-transparent hover:border-red-200">Done / Delete</button>
                            </td>
                          </tr>
                        ))}
                        {requests.length === 0 && (
                          <tr><td colSpan={4} className="p-10 text-center font-bold text-slate-400">No new orders or requests right now!</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Categories Tab */}
              {activeTab === 'categories' && ( 
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                 <div className="bg-white p-8 rounded-3xl border border-slate-200 h-fit">
                   <h3 className="font-black text-lg mb-6">New Category</h3>
                   <form onSubmit={handleAddCategory} className="space-y-4">
                     <input type="text" value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Category Name" className="w-full px-5 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none" required/>
                     <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-black">SAVE</button>
                   </form>
                 </div>
                 <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 overflow-hidden">
                   <table className="w-full text-left">
                     <thead className="bg-slate-50 border-b"><tr className="text-[10px] font-black uppercase text-slate-400"><th className="p-6">Name</th><th className="p-6 text-right">Action</th></tr></thead>
                     <tbody>
                       {categories.map(c => (
                         <tr key={c.$id} className="border-b">
                           <td className="p-6 font-bold">{c.name}</td>
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
                  <div className={`p-10 rounded-3xl border shadow-sm transition-all ${editingId ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black text-xl text-slate-800">{editingId ? '✏️ Update Listing' : '➕ Add New Listing'}</h3>
                      {editingId && <button onClick={cancelEdit} className="text-sm font-bold text-slate-500 hover:text-red-500">Cancel Edit</button>}
                    </div>

                    <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <input type="text" value={pTitle} onChange={(e) => setPTitle(e.target.value)} placeholder="Title / Name" className="px-5 py-4 rounded-xl border-2 border-slate-100 outline-none focus:border-indigo-500 bg-white" required/>
                      <input type="number" value={pPrice} onChange={(e) => setPPrice(e.target.value)} placeholder="Price (৳)" className="px-5 py-4 rounded-xl border-2 border-slate-100 outline-none focus:border-indigo-500 bg-white" required/>
                      
                      <select value={pCatId} onChange={(e) => setPCatId(e.target.value)} className="px-5 py-4 rounded-xl border-2 border-slate-100 outline-none bg-white focus:border-indigo-500" required>
                        <option value="">Select Category</option>
                        {categories.map(cat => <option key={cat.$id} value={cat.$id}>{cat.name}</option>)}
                      </select>
                      
                      <input type="text" value={pYoutube} onChange={(e) => setPYoutube(e.target.value)} placeholder="YouTube Video URL (Optional)" className="px-5 py-4 rounded-xl border-2 border-slate-100 outline-none focus:border-indigo-500 bg-white" />
                      
                      <div className="md:col-span-2">
                        <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                          Upload Images (Select Multiple) {editingId && <span className="text-indigo-500 lowercase normal-case">- leave empty to keep existing images</span>}
                        </label>
                        <input id="image-upload" type="file" multiple accept="image/*" onChange={(e) => setImageFiles(e.target.files)} className="w-full px-5 py-4 rounded-xl border-2 border-slate-100 outline-none focus:border-indigo-500 bg-white cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                      </div>
                      
                      <textarea value={pDesc} onChange={(e) => setPDesc(e.target.value)} placeholder="Detailed Description..." className="md:col-span-2 px-5 py-4 rounded-xl border-2 border-slate-100 outline-none focus:border-indigo-500 bg-white min-h-[120px]" />
                      
                      <div className="md:col-span-2 flex gap-4">
                        <button type="submit" disabled={isUploading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 transition-all text-white font-black py-5 rounded-xl shadow-lg flex justify-center items-center gap-2">
                          {isUploading ? 'SAVING...' : (editingId ? 'UPDATE LISTING' : 'PUBLISH LISTING')}
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b"><tr className="text-[10px] font-black uppercase text-slate-400"><th className="p-6">Details</th><th className="p-6">Images</th><th className="p-6 text-right">Action</th></tr></thead>
                      <tbody>
                        {products.map(p => (
                          <tr key={p.$id} className={`border-b hover:bg-slate-50 transition-colors ${editingId === p.$id ? 'bg-indigo-50/50' : ''}`}>
                            <td className="p-6">
                              <p className="font-bold text-lg text-slate-800">{p.title}</p>
                              <p className="font-black text-indigo-600 mt-1">৳{p.price.toLocaleString()}</p>
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