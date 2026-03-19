import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ID } from 'appwrite';
import { databases, DATABASE_ID, REQUEST_COLLECTION_ID } from './appwrite';

function Contact() {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 🔴 কন্ট্যাক্ট ফর্মের ডাটা requests কালেকশনে পাঠানো হচ্ছে
      await databases.createDocument(DATABASE_ID, REQUEST_COLLECTION_ID, ID.unique(), {
        customer_name: formData.name,
        phone: formData.phone,
        address: "Online Message", // অ্যাড্রেস ফিল্ডে ডিফল্ট লেখা দিলাম
        request_type: "message", // 🔴 টাইপ দিলাম message
        product_name: "General Inquiry", 
        extra_info: `Email: ${formData.email} \nMessage: ${formData.message}`, // ইমেইল এবং মেসেজ এখানে থাকবে
        total_price: 0
      });

      alert("Thanks for contacting us! We'll reply soon.");
      setFormData({ name: '', phone: '', email: '', message: '' }); // ফর্ম ক্লিয়ার
    } catch (error) {
      console.error("Contact Form Error:", error);
      alert("দুঃখিত, মেসেজ পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* 🌟 Header */}
      <header className="bg-slate-900 text-white py-4 px-4 md:px-10 flex items-center justify-between sticky top-0 z-50 border-b border-slate-800 shadow-sm">
         <Link to="/" className="text-3xl font-black text-orange-400 tracking-tighter">
            BDT
         </Link>
         <Link to="/" className="font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-2">
           <span>←</span> Back to Home
         </Link>
      </header>

      {/* 📝 Contact Content */}
      <main className="max-w-[1000px] mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Get in Touch</h1>
          <p className="text-slate-500 text-lg">We'd love to hear from you. Please fill out this form or reach out to us directly.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100">
          
          {/* Contact Info */}
          <div className="space-y-8 bg-slate-50 p-8 rounded-2xl border border-slate-100 h-fit">
            <div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Office Address</h3>
              <p className="text-slate-800 font-bold text-lg">Dhaka, Bangladesh</p>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Email Us</h3>
              <p className="text-orange-600 font-bold text-lg">bdtbd9@gmail.com</p>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Call Us</h3>
              <p className="text-slate-800 font-bold text-lg">+880 1633334466</p>
            </div>
          </div>

          {/* 🔴 Contact Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Full Name *</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 rounded-xl border-2 border-slate-100 outline-none focus:border-orange-500 bg-slate-50" placeholder="John Doe" />
            </div>
            
            {/* 🔴 নতুন ফিল্ড: Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Phone Number *</label>
              <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-5 py-4 rounded-xl border-2 border-slate-100 outline-none focus:border-orange-500 bg-slate-50" placeholder="01XXX-XXXXXX" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email Address *</label>
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-5 py-4 rounded-xl border-2 border-slate-100 outline-none focus:border-orange-500 bg-slate-50" placeholder="john@example.com" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Message *</label>
              <textarea required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full px-5 py-4 rounded-xl border-2 border-slate-100 outline-none focus:border-orange-500 bg-slate-50 h-32" placeholder="How can we help you?"></textarea>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-black py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-1">
              {isSubmitting ? 'SENDING...' : 'SEND MESSAGE'}
            </button>
          </form>

        </div>
      </main>
    </div>
  );
}

export default Contact;