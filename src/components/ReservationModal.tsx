import { useState } from 'react';
import { Language } from '../translations';
import { Tour, createReservation } from '../api';
import Toast from './Toast';

interface ReservationModalProps {
  tour: Tour;
  language: Language;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ReservationModal({ tour, language, onClose, onSuccess }: ReservationModalProps) {
  const isKa = language === 'ka';
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [form, setForm] = useState({
    name: '',
    surname: '',
    phone: '',
    email: '',
    guests: 1,
    start_date: '',
    duration_days: 1,
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'guests' || name === 'duration_days' ? parseInt(value) || 1 : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.surname || !form.phone || !form.start_date) return;

    setLoading(true);
    try {
      await createReservation({
        tour_id: tour.id,
        tour_title: tour.title,
        tour_image: tour.image,
        tour_location: tour.location,
        operator_id: tour.operator_id || tour.operator || '',
        tourist_name: form.name,
        tourist_surname: form.surname,
        tourist_phone: form.phone,
        tourist_email: form.email,
        guests: form.guests,
        start_date: form.start_date,
        duration_days: form.duration_days,
        description: form.description || undefined,
      });
      setStep('success');
      onSuccess?.();
    } catch (err: any) {
      setToast({ message: err.message || (isKa ? 'შეცდომა' : 'Something went wrong'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-dark/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up max-h-[95vh] flex flex-col">
        
        {/* Header */}
        <div className="relative px-8 pt-8 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
              <img src={tour.image} alt={tour.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black text-text-main leading-tight truncate">
                {isKa ? 'ტურის დაჯავშნა' : 'Reserve Tour'}
              </h2>
              <p className="text-sm font-bold text-text-muted truncate">{tour.title}</p>
              <p className="text-xs font-bold text-primary flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-xs">location_on</span>
                {tour.location}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-background-light flex items-center justify-center text-text-muted hover:text-text-main hover:bg-border-light transition-all">
            <span className="material-symbols-outlined text-sm font-black">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 overflow-y-auto flex-1">
          {step === 'success' ? (
            <div className="text-center py-10 animate-fade-in">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-5xl text-green-600">check_circle</span>
              </div>
              <h3 className="text-2xl font-black text-text-main mb-3">
                {isKa ? 'მოთხოვნა გაგზავნილია!' : 'Request Sent!'}
              </h3>
              <p className="text-text-muted font-medium max-w-sm mx-auto mb-2">
                {isKa
                  ? 'თქვენი რეზერვაციის მოთხოვნა წარმატებით გაიგზავნა ტურ-ოპერატორთან.'
                  : 'Your reservation request has been sent to the tour operator.'}
              </p>
              <p className="text-xs text-text-muted font-bold mb-8">
                {isKa
                  ? 'ოპერატორი დაგიკავშირდებათ თქვენს მიერ მითითებული საკონტაქტო ინფორმაციით.'
                  : 'The operator will contact you using the contact information you provided.'}
              </p>
              <button
                onClick={onClose}
                className="px-10 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {isKa ? 'დახურვა' : 'Close'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name & Surname */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">
                    {isKa ? 'სახელი' : 'First Name'} *
                  </label>
                  <input
                    required name="name" type="text" value={form.name} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-border-light bg-background-light focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-text-main text-sm"
                    placeholder={isKa ? 'გიორგი' : 'John'}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">
                    {isKa ? 'გვარი' : 'Last Name'} *
                  </label>
                  <input
                    required name="surname" type="text" value={form.surname} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-border-light bg-background-light focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-text-main text-sm"
                    placeholder={isKa ? 'ბერიძე' : 'Doe'}
                  />
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">
                    {isKa ? 'ტელეფონი' : 'Phone Number'} *
                  </label>
                  <input
                    required name="phone" type="tel" value={form.phone} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-border-light bg-background-light focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-text-main text-sm"
                    placeholder="+995 5XX XXX XXX"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">
                    {isKa ? 'ელ-ფოსტა' : 'Email'}
                  </label>
                  <input
                    name="email" type="email" value={form.email} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-border-light bg-background-light focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-text-main text-sm"
                    placeholder="john@mail.com"
                  />
                </div>
              </div>

              {/* Start Date & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">
                    {isKa ? 'სასურველი თარიღი' : 'Preferred Date'} *
                  </label>
                  <input
                    required name="start_date" type="date" value={form.start_date} onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl border border-border-light bg-background-light focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-text-main text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">
                    {isKa ? 'რამდენი დღე' : 'Duration (Days)'}
                  </label>
                  <input
                    name="duration_days" type="number" min={1} max={30} value={form.duration_days} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-border-light bg-background-light focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-text-main text-sm"
                  />
                </div>
              </div>

              {/* Guests */}
              <div>
                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">
                  {isKa ? 'სტუმრების რაოდენობა' : 'Number of Guests'} *
                </label>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => setForm(p => ({ ...p, guests: Math.max(1, p.guests - 1) }))}
                    className="w-10 h-10 rounded-xl border border-border-light flex items-center justify-center text-text-muted hover:border-primary hover:text-primary transition-all">
                    <span className="material-symbols-outlined text-lg">remove</span>
                  </button>
                  <span className="text-2xl font-black text-text-main w-10 text-center">{form.guests}</span>
                  <button type="button" onClick={() => setForm(p => ({ ...p, guests: Math.min(50, p.guests + 1) }))}
                    className="w-10 h-10 rounded-xl border border-border-light flex items-center justify-center text-text-muted hover:border-primary hover:text-primary transition-all">
                    <span className="material-symbols-outlined text-lg">add</span>
                  </button>
                  <span className="text-xs font-bold text-text-muted ml-2">
                    {isKa ? 'ადამიანი' : 'people'}
                  </span>
                </div>
              </div>

              {/* Description (optional) */}
              <div>
                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">
                  {isKa ? 'დამატებითი ინფორმაცია' : 'Additional Notes'}
                  <span className="text-[9px] font-medium text-gray-400 ml-1 normal-case tracking-normal">
                    ({isKa ? 'არასავალდებულო' : 'optional'})
                  </span>
                </label>
                <textarea
                  name="description" value={form.description} onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-border-light bg-background-light focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-text-main text-sm resize-none"
                  placeholder={isKa ? 'სპეციალური მოთხოვნები, კითხვები...' : 'Special requirements, questions...'}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-base shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">send</span>
                    {isKa ? 'რეზერვაციის გაგზავნა' : 'Send Reservation Request'}
                  </>
                )}
              </button>

              <p className="text-center text-[9px] font-black text-text-muted uppercase tracking-[0.12em]">
                {isKa
                  ? 'ოპერატორი დაგიკავშირდებათ დასადასტურებლად'
                  : 'The operator will contact you to confirm'}
              </p>
            </form>
          )}
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
