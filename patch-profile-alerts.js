const fs = require('fs');
const p = 'src/pages/Profile.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/const handleDeleteTour = async[\\s\\S]*?catch \\(err\\) \\{[\\s\\S]*?alert\\(isKa \\? 'შეცდომა წაშლისას' : 'Failed to delete tour'\\);\\n    \\}\\n  \\};/, `const promptDeleteTour = (id: number) => {
    setTourToDelete(id);
  };

  const confirmDeleteTour = async () => {
    if (tourToDelete === null) return;
    setIsDeletingTour(true);
    try {
      await deleteTour(tourToDelete);
      setMyTours(myTours.filter(t => t.id !== tourToDelete));
      setToast({ message: isKa ? 'წარმატებით წაიშალა' : 'Tour deleted successfully', type: 'success' });
    } catch (err) {
      setToast({ message: isKa ? 'შეცდომა წაშლისას' : 'Failed to delete tour', type: 'error' });
    } finally {
      setIsDeletingTour(false);
      setTourToDelete(null);
    }
  };`);

c = c.replace(/onClick=\\{\\(\\) => handleDeleteTour\\(tour\\.id\\)\\}/g, 'onClick={() => promptDeleteTour(tour.id)}');

c = c.replace(/alert\\(isKa \\? 'პროფილი წარმატებით განახლდა' : 'Profile updated successfully'\\);/g, `setToast({ message: isKa ? 'პროფილი წარმატებით განახლდა' : 'Profile updated successfully', type: 'success' });`);
c = c.replace(/alert\\(isKa \\? 'შეცდომა განახლებისას' : 'Failed to update profile'\\);/g, `setToast({ message: isKa ? 'შეცდომა განახლებისას' : 'Failed to update profile', type: 'error' });`);

const modalJSX = `      </div>

      <AnimatePresence>
        {tourToDelete !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-border-light relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-red-500 text-3xl">delete_sweep</span>
              </div>
              <h3 className="text-xl font-black text-center text-text-main mb-2">
                {isKa ? 'გსურთ ტურის წაშლა?' : 'Delete this tour?'}
              </h3>
              <p className="text-sm text-text-muted text-center font-medium mb-6">
                {isKa ? 'ეს ქმედება სამუდამოა და ვეღარ აღადგენთ.' : 'This action is permanent and cannot be undone.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setTourToDelete(null)}
                  disabled={isDeletingTour}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                >
                  {isKa ? 'გაუქმება' : 'Cancel'}
                </button>
                <button
                  onClick={confirmDeleteTour}
                  disabled={isDeletingTour}
                  className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-black rounded-xl shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isDeletingTour ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      {isKa ? 'წაშლა' : 'Delete'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (`;

c = c.replace(/<AnimatePresence>\\s*\\{\\s*toast && \\(/g, modalJSX);

fs.writeFileSync(p, c);
console.log('Done!');
