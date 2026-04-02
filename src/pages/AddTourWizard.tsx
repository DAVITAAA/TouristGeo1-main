import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, translations } from '../translations';
import { User, createTour, updateTour } from '../api';
import Georgia3DMap from '../components/Georgia3DMap';
import Toast from '../components/Toast';

interface AddTourWizardProps {
  onNavigate: (page: string, data?: any) => void;
  language: Language;
  user: User | null;
  tourToEdit?: any;
}

export default function AddTourWizard({ onNavigate, language, user, tourToEdit }: AddTourWizardProps) {
  const isKa = language === 'ka';
  const t = translations[language];
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(tourToEdit?.image || null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>(tourToEdit?.gallery || []);
  const [itineraryFiles, setItineraryFiles] = useState<{ [key: number]: File }>({});
  const [itineraryPreviews, setItineraryPreviews] = useState<{ [key: number]: string }>(
    tourToEdit?.itinerary?.reduce((acc: any, day: any, i: number) => {
      if (day.image) acc[i] = day.image;
      return acc;
    }, {}) || {}
  );
  
  // Form State
  const [formData, setFormData] = useState({
    title: tourToEdit?.title || '',
    location: tourToEdit?.location || '',
    category: tourToEdit?.category || 'Hiking & Adventure',
    description: tourToEdit?.description || '',
    price: tourToEdit?.price || 250,
    maxGroupSize: tourToEdit?.maxGroupSize || 12,
    duration: tourToEdit?.duration || 5,
    itinerary: tourToEdit?.itinerary?.length ? tourToEdit.itinerary : [{ day: 1, title: '', activities: [''], description: '' }],
    image: tourToEdit?.image || '',
    gallery: tourToEdit?.gallery || [] as string[]
  });

  const handleItineraryChange = (index: number, field: string, value: any) => {
    const newItinerary = [...formData.itinerary];
    newItinerary[index] = { ...newItinerary[index], [field]: value };
    setFormData({ ...formData, itinerary: newItinerary });
  };

  const addDay = () => {
    setFormData({
      ...formData,
      itinerary: [...formData.itinerary, { day: formData.itinerary.length + 1, title: '', activities: [''], description: '' }]
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setGalleryFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setGalleryPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const handleItineraryImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setItineraryFiles(prev => ({ ...prev, [index]: file }));
      setItineraryPreviews(prev => ({ ...prev, [index]: URL.createObjectURL(file) }));
    }
  };

  const removeGalleryImage = (index: number) => {
    const previewToRemove = galleryPreviews[index];
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    
    // If it's a blob URL, we also need to remove it from galleryFiles
    if (previewToRemove.startsWith('blob:')) {
      // We need to find which file this blob corresponds to. 
      // This is a bit loose, so let's improve how we store them.
    }
  };

  const removeDay = (index: number) => {
    if (formData.itinerary.length <= 1) return;
    const newItinerary = formData.itinerary
      .filter((_, i) => i !== index)
      .map((day, i) => ({ ...day, day: i + 1 }));
    setFormData({ ...formData, itinerary: newItinerary });
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Create FormData for the backend API
      const body = new FormData();
      body.append('title', formData.title);
      body.append('location', formData.location);
      body.append('category', formData.category);
      body.append('description', formData.description);
      body.append('price', formData.price.toString());
      body.append('maxGroupSize', formData.maxGroupSize.toString());
      body.append('duration', formData.duration.toString());
      body.append('itinerary', JSON.stringify(formData.itinerary));
      
      if (imageFile) {
        body.append('image', imageFile);
      } else {
        body.append('imageUrl', formData.image);
      }

      // Add gallery images
      galleryFiles.forEach(file => body.append('gallery', file));
      // Keep existing gallery URLs that weren't removed
      const existingGallery = galleryPreviews.filter(p => p.startsWith('http'));
      body.append('existingGallery', JSON.stringify(existingGallery));

      // Handle itinerary with images
      const finalItinerary = formData.itinerary.map((day, i) => {
        const item = { ...day };
        if (itineraryPreviews[i]?.startsWith('http')) {
          item.image = itineraryPreviews[i];
        }
        return item;
      });
      body.append('itinerary', JSON.stringify(finalItinerary));
      
      // Append new itinerary images
      Object.keys(itineraryFiles).forEach(index => {
        body.append(`itineraryImage_${index}`, itineraryFiles[parseInt(index)]);
      });

      if (tourToEdit) {
        await updateTour(tourToEdit.id, body);
      } else {
        await createTour(body);
      }

      setShowSuccess(true);
      setTimeout(() => {
        onNavigate('profile');
      }, 2500);
    } catch (err: any) {
      console.error('Failed to create tour:', err);
      const msg = err.message || (typeof err === 'string' ? err : 'Unknown error');
      setToast({ message: isKa ? `ტურის შენახვა ვერ მოხერხდა: ${msg}` : `Failed to save tour: ${msg}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-background-light pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header & Progress */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-text-main">{tourToEdit ? (isKa ? 'ტურის რედაქტირება' : 'Edit Tour') : t.wizard_title}</h1>
            <p className="text-sm font-medium text-text-muted">{tourToEdit ? (isKa ? 'განაახლეთ თქვენი ტური' : 'Update your tour details') : t.wizard_subtitle}</p>
          </div>
          <div className="flex gap-3">
             <button className="px-5 py-2.5 rounded-xl bg-white border border-border-light text-xs font-black uppercase tracking-widest text-text-muted hover:text-text-main transition-all">{isKa ? 'შენახვა' : 'Save Draft'}</button>
             <button className="px-5 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-black uppercase tracking-widest border border-primary/20">{isKa ? 'გზამკვლევი' : 'Listing Guide'}</button>
          </div>
        </div>

        {/* Form Sections */}
        <div className="space-y-12">
          {/* Section 1: Essentials */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
               <span className="material-symbols-outlined text-primary font-bold">info</span>
               <h2 className="text-xl font-black text-text-main uppercase tracking-widest">{t.wizard_essentials}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t.wizard_tour_title}</label>
                <input 
                  type="text" 
                  placeholder={isKa ? 'მაგ. სვანეთის 5-დღიანი თავგადასავალი' : "e.g. 5-Day Hidden Gems of Svaneti"}
                  className="w-full p-5 rounded-2xl bg-white border border-border-light font-bold text-text-main focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t.wizard_location}</label>
                <div className="relative">
                   <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-text-muted">location_on</span>
                   <input 
                    type="text" 
                    placeholder={isKa ? 'მაგ. მესტია, საქართველო' : "e.g. Mestia, Georgia"}
                    className="w-full pl-14 pr-5 py-5 rounded-2xl bg-white border border-border-light font-bold text-text-main outline-none"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t.wizard_category}</label>
                <select 
                  className="w-full p-5 rounded-2xl bg-white border border-border-light font-bold text-text-main outline-none"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                   <option>{isKa ? 'ლაშქრობა & თავგადასავალი' : 'Hiking & Adventure'}</option>
                   <option>{isKa ? 'ღვინო & გასტრონომია' : 'Wine & Gastronomy'}</option>
                   <option>{isKa ? 'ისტორიული & კულტურული' : 'Historical & Cultural'}</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 2: Image Gallery */}
          <section className="space-y-8">
             <div className="flex items-center gap-3">
               <span className="material-symbols-outlined text-primary font-bold">image</span>
               <h2 className="text-xl font-black text-text-main uppercase tracking-widest">{t.wizard_gallery}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
               <label className="aspect-[4/3] rounded-[32px] border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-4 group cursor-pointer hover:border-primary transition-all relative overflow-hidden shadow-sm">
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <span className="material-symbols-outlined text-white text-3xl">edit</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[40px] text-primary">add_photo_alternate</span>
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest text-center px-4">{isKa ? 'ატვირთეთ მთავარი სურათი' : 'Upload Main Cover'}</p>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
               </label>

               {galleryPreviews.map((preview, i) => (
                 <div key={i} className="aspect-[4/3] rounded-[32px] overflow-hidden relative group shadow-sm">
                    <img src={preview} className="w-full h-full object-cover" alt="" />
                    <button 
                      onClick={() => removeGalleryImage(i)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                 </div>
               ))}

               <label className="aspect-[4/3] rounded-[32px] border-2 border-dashed border-border-light bg-gray-50 flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-text-muted hover:text-primary">
                  <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                  <p className="text-[10px] font-black uppercase tracking-widest">{isKa ? 'ფოტოს დამატება' : 'Add Photo'}</p>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleGalleryChange} />
               </label>
            </div>
            <p className="text-[10px] font-bold text-text-muted italic">{isKa ? 'ატვირთეთ 1 მაღალი ხარისხის სურათი მთავარი ფოტოსისთვის. მინიმალური ზომა 1200x800px.' : 'Upload 1 high-resolution main cover photo. Minimum size 1200x800px.'}</p>
          </section>

          {/* Section 3: Description */}
          <section className="space-y-8">
             <div className="flex items-center gap-3">
               <span className="material-symbols-outlined text-primary font-bold">description</span>
               <h2 className="text-xl font-black text-text-main uppercase tracking-widest">{t.wizard_description}</h2>
            </div>
            <div className="bg-white rounded-[32px] border border-border-light overflow-hidden shadow-sm">
               <div className="p-4 border-b border-border-light flex gap-4">
                  <button className="material-symbols-outlined text-gray-400 hover:text-text-main">format_bold</button>
                  <button className="material-symbols-outlined text-gray-400 hover:text-text-main">format_italic</button>
                  <button className="material-symbols-outlined text-gray-400 hover:text-text-main">format_list_bulleted</button>
               </div>
               <textarea 
                rows={8}
                placeholder={isKa ? 'აღწერეთ თქვენი ტურის უნიკალური გამოცდილება, ისტორია და მახასიათებლები...' : "Describe the magical experience, the history, and the unique selling points of your tour..."}
                className="w-full p-8 font-medium text-text-muted outline-none resize-none"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
               />
            </div>
          </section>

          {/* Section 4: Pricing & Capacity */}
          <section className="space-y-8">
             <div className="flex items-center gap-3">
               <span className="material-symbols-outlined text-primary font-bold">payments</span>
               <h2 className="text-xl font-black text-text-main uppercase tracking-widest">{isKa ? 'ფასი & რაოდენობა' : 'Pricing & Capacity'}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="p-6 bg-white rounded-3xl border border-border-light space-y-4 shadow-sm">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{isKa ? 'ფასი ერთ კაცზე' : 'Price Per Person'}</label>
                  <div className="flex items-center gap-3 text-2xl font-black text-text-main">
                     <span className="text-text-muted">$</span>
                     <input 
                      type="number" 
                      value={formData.price} 
                      onChange={(e) => setFormData({...formData, price: parseInt(e.target.value)})}
                      className="w-full outline-none" 
                    />
                  </div>
               </div>
               <div className="p-6 bg-white rounded-3xl border border-border-light space-y-4 shadow-sm">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{isKa ? 'ჯგუფის მაქს. ზომა' : 'Max Group Size'}</label>
                  <div className="flex items-center gap-3 text-2xl font-black text-text-main">
                     <span className="material-symbols-outlined text-text-muted">group</span>
                     <input 
                      type="number" 
                      value={formData.maxGroupSize} 
                      onChange={(e) => setFormData({...formData, maxGroupSize: parseInt(e.target.value)})}
                      className="w-full outline-none" 
                    />
                  </div>
               </div>
               <div className="p-6 bg-white rounded-3xl border border-border-light space-y-4 shadow-sm">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{isKa ? 'ხანგრძლივობა (დღე)' : 'Duration (Days)'}</label>
                  <div className="flex items-center gap-3 text-2xl font-black text-text-main">
                     <span className="material-symbols-outlined text-text-muted">schedule</span>
                     <input 
                      type="number" 
                      value={formData.duration} 
                      onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                      className="w-full outline-none" 
                    />
                  </div>
               </div>
            </div>
          </section>

          {/* Section 5: Itinerary */}
          <section className="space-y-8">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary font-bold">route</span>
                  <h2 className="text-xl font-black text-text-main uppercase tracking-widest">{t.wizard_step_2_title}</h2>
               </div>
               <button onClick={addDay} className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                  <span className="material-symbols-outlined text-base">add_circle</span> {isKa ? 'დღის დამატება' : 'Add Another Day'}
               </button>
            </div>
            
             <AnimatePresence>
               {formData.itinerary.map((day, index) => (
                  <motion.div 
                     key={index}
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     exit={{ opacity: 0, height: 0 }}
                     className="bg-white p-8 rounded-[40px] border border-border-light shadow-sm space-y-8 relative overflow-hidden mb-6"
                  >
                     <div className="flex items-center justify-between">
                        <h3 className="font-black text-primary uppercase tracking-widest">{isKa ? `დღე ${index + 1}` : `Day ${index + 1}`}</h3>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            removeDay(index);
                          }} 
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-text-muted hover:text-red-500 hover:bg-red-100 transition-all cursor-pointer group"
                        >
                          <span className="material-symbols-outlined transition-transform group-hover:scale-110">delete</span>
                        </button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <input 
                              type="text" 
                              value={day.title}
                              onChange={(e) => handleItineraryChange(index, 'title', e.target.value)}
                              placeholder={isKa ? 'აქტივობის დასახელება' : "Activity Title"} 
                              className="w-full p-4 rounded-xl bg-background-light border-none font-bold outline-none" 
                           />
                           <textarea 
                              value={day.description}
                              onChange={(e) => handleItineraryChange(index, 'description', e.target.value)}
                              placeholder={isKa ? 'რას გააკეთებენ მოგზაურები ამ დღეს?' : "What will travelers do on this day?"} 
                              className="w-full p-4 rounded-xl bg-background-light border-none font-medium h-32 outline-none resize-none" 
                           />
                        </div>
                        <label className="rounded-3xl border-2 border-dashed border-border-light bg-background-light flex flex-col items-center justify-center gap-4 text-text-muted cursor-pointer hover:border-primary hover:text-primary transition-all relative overflow-hidden group">
                            {itineraryPreviews[index] ? (
                              <>
                                <img src={itineraryPreviews[index]} className="w-full h-full object-cover" alt="" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                   <span className="material-symbols-outlined text-white text-3xl">edit</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-[32px]">add_a_photo</span>
                                <p className="text-[10px] font-black uppercase tracking-widest">{isKa ? 'სურათი' : 'Day Image'}</p>
                              </>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleItineraryImageChange(index, e)} />
                        </label>
                     </div>
                  </motion.div>
               ))}
             </AnimatePresence>
          </section>

          {/* Footer Actions */}
          <div className="pt-12 border-t border-border-light flex justify-end gap-6">
             <div className="flex gap-4 w-full md:w-auto">
                <button onClick={() => onNavigate('home')} className="flex-1 md:flex-none px-10 py-5 bg-white text-text-main rounded-3xl border border-border-light font-black shadow-lg hover:bg-gray-50 transition-all">{isKa ? 'გაუქმება' : 'Cancel'}</button>
                <button 
                  onClick={handleSubmit}
                  className="flex-1 md:flex-none px-10 py-5 bg-primary text-white rounded-3xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                   {loading ? (
                     <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                   ) : (
                     <>{tourToEdit ? (isKa ? 'შენახვა' : 'Save Changes') : (isKa ? 'გამოქვეყნება' : 'Publish')} <span className="material-symbols-outlined">{tourToEdit ? 'save' : 'publish'}</span></>
                   )}
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
      
      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>

      {/* Success Toast / Modal */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
             <motion.div
               initial={{ opacity: 0, scale: 0.8, y: 50 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.8, y: -50 }}
               className="bg-white rounded-[32px] p-8 md:p-12 flex flex-col items-center justify-center text-center shadow-2xl max-w-sm w-full border border-border-light pointer-events-auto relative overflow-hidden"
             >
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 to-primary"></div>
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 text-green-500 shadow-inner"
                >
                   <span className="material-symbols-outlined text-[64px]">task_alt</span>
                </motion.div>
                <h3 className="text-2xl font-black text-text-main mb-2">
                  {isKa ? 'წარმატება!' : 'Success!'}
                </h3>
                <p className="text-text-muted font-medium">
                  {tourToEdit 
                    ? (isKa ? 'თქვენი ტური წარმატებით განახლდა.' : 'Your tour was successfully updated.') 
                    : (isKa ? 'თქვენი ახალი ტური გამოქვეყნდა! მალე გადახვალთ პროფილზე.' : 'Your new tour is published! Redirecting to profile...')}
                </p>
             </motion.div>
             {/* Confetti effect placeholder if desired, or extra blur bg */}
             <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="fixed inset-0 bg-white/40 backdrop-blur-sm -z-10 pointer-events-auto" 
             />
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
