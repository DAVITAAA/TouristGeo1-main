import os

file_path = 'src/pages/Profile.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace handleDeleteTour
old_delete = """  const handleDeleteTour = async (id: number) => {
    if (!window.confirm(isKa ? 'ნამდვილად გსურთ წაშლა?' : 'Are you sure you want to delete this tour?')) return;
    try {
      await deleteTour(id);
      setMyTours(myTours.filter(t => t.id !== id));
      alert(isKa ? 'წარმატებით წაიშალა' : 'Tour deleted successfully');
    } catch (err) {
      alert(isKa ? 'შეცდომა წაშლისას' : 'Failed to delete tour');
    }
  };"""

new_delete = """  const promptDeleteTour = (id: number) => {
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
  };"""

# 2. Replace handleUpdateProfile
old_update = """  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateMe(editForm);
      onUpdateUser(editForm);
      alert(isKa ? 'პროფილი წარმატებით განახლდა' : 'Profile updated successfully');
    } catch (err) {
      alert(isKa ? 'შეცდომა განახლებისას' : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };"""

new_update = """  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateMe(editForm);
      onUpdateUser(editForm);
      setToast({ message: isKa ? 'პროფილი წარმატებით განახლდა' : 'Profile updated successfully', type: 'success' });
    } catch (err) {
      setToast({ message: isKa ? 'შეცდომა განახლებისას' : 'Failed to update profile', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };"""

# 3. Handle AnimatePresence
old_modal = """      <AnimatePresence>
        {toast && ("""

new_modal = """      <AnimatePresence>
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
        {toast && ("""

# Replace preserving windows line endings by fixing string matching
old_delete = old_delete.replace('\\n', '\\r\\n')
new_delete = new_delete.replace('\\n', '\\r\\n')
old_update = old_update.replace('\\n', '\\r\\n')
new_update = new_update.replace('\\n', '\\r\\n')
old_modal = old_modal.replace('\\n', '\\r\\n')
new_modal = new_modal.replace('\\n', '\\r\\n')

if old_delete in content:
    content = content.replace(old_delete, new_delete)
    print("Replaced deleteTour")
else:
    print("Could not find deleteTour using windows CRLF, trying unix LF")
    content = content.replace(old_delete.replace('\\r\\n', '\\n'), new_delete.replace('\\r\\n', '\\n'))

if old_update in content:
    content = content.replace(old_update, new_update)
    print("Replaced updateProfile")
else:
    content = content.replace(old_update.replace('\\r\\n', '\\n'), new_update.replace('\\r\\n', '\\n'))
    
if old_modal in content:
    content = content.replace(old_modal, new_modal)
    print("Replaced modal")
else:
    content = content.replace(old_modal.replace('\\r\\n', '\\n'), new_modal.replace('\\r\\n', '\\n'))

content = content.replace("onClick={() => handleDeleteTour(tour.id)}", "onClick={() => promptDeleteTour(tour.id)}")

with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

# Use regex to find out what might be breaking.
print("Done patching.")
