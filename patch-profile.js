import fs from 'fs';

const path = 'src/pages/Profile.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add import
if (!code.includes('deleteAccount')) {
  code = code.replace(
    "import { fetchMyBookings, fetchMyTours, uploadAvatar, initiatePasswordChange, User } from '../api';",
    "import { fetchMyBookings, fetchMyTours, uploadAvatar, initiatePasswordChange, deleteAccount, User } from '../api';"
  );
}

// 2. Add state and handler
const targetState = 'const [targetEmail, setTargetEmail] = useState<string | null>(null);';
const newState = `
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteToursChecked, setDeleteToursChecked] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await deleteAccount();
      onLogout();
      onNavigate('home');
    } catch (err: any) {
      alert(isKa ? \`შეცდომა წაშლისას: \${err.message}\` : \`Error deleting account: \${err.message}\`);
    } finally {
      setIsDeletingAccount(false);
    }
  };
`;
if (!code.includes('handleDeleteAccount')) {
  code = code.replace(targetState, targetState + "\n" + newState);
}

// 3. Replace danger zone block
const dangerZoneRegex = /<div className="mt-8 p-6 rounded-3xl bg-red-50 border border-red-100">([\s\S]*?)<\/button>\s*<\/div>/;
const newDangerZone = `<div className="mt-8 p-6 rounded-3xl bg-red-50 border border-red-100">
                <h3 className="text-red-800 font-black mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined">dangerous</span>
                  {isKa ? 'საშიში ზონა' : 'Danger Zone'}
                </h3>
                <p className="text-sm text-red-600 mb-4 font-medium">
                  {isKa ? 'ანგარიშის წაშლა სამუდამოა და ვერ აღდგება.' : 'Deleting your account is permanent and cannot be undone.'}
                </p>

                {showDeleteConfirm ? (
                  <div className="bg-white p-4 rounded-xl border border-red-200 mt-4 animate-fade-in shadow-sm">
                    <p className="text-red-700 font-bold mb-3 text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">warning</span>
                      {isKa ? 'დარწმუნებული ხართ?' : 'Are you completely sure?'}
                    </p>
                    
                    {user.role === 'operator' && myTours.length > 0 && (
                      <label className="flex items-start gap-3 p-3 bg-red-50 rounded-lg mb-4 cursor-pointer hover:bg-red-100/50 transition-colors border border-red-100">
                        <input 
                          type="checkbox" 
                          checked={deleteToursChecked}
                          onChange={(e) => setDeleteToursChecked(e.target.checked)}
                          className="mt-1 w-4 h-4 text-red-600 rounded border-red-300 focus:ring-red-500 cursor-pointer"
                        />
                        <span className="text-xs text-red-800 font-semibold leading-relaxed">
                          {isKa 
                            ? \`ვადასტურებ, რომ ჩემი \${myTours.length} ტური სამუდამოდ წაიშლება ანგარიშთან ერთად.\` 
                            : \`I acknowledge that my \${myTours.length} published tours will be permanently deleted along with my account.\`}
                        </span>
                      </label>
                    )}

                    <div className="flex gap-3">
                      <button 
                        onClick={() => { setShowDeleteConfirm(false); setDeleteToursChecked(false); }}
                        className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs transition-colors"
                        disabled={isDeletingAccount}
                      >
                        {isKa ? 'გაუქმება' : 'Cancel'}
                      </button>
                      <button 
                        onClick={handleDeleteAccount}
                        disabled={isDeletingAccount || (user.role === 'operator' && myTours.length > 0 && !deleteToursChecked)}
                        className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white font-black rounded-lg text-xs shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        {isDeletingAccount ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[14px]">delete_forever</span>
                            {isKa ? 'სამუდამოდ წაშლა' : 'Delete Permanently'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-700 font-black text-sm flex items-center gap-2 hover:underline bg-white px-4 py-2 rounded-lg border border-red-200 shadow-sm transition-all hover:shadow-md w-fit"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    {isKa ? 'ანგარიშის წაშლა' : 'Delete Account'}
                  </button>
                )}
              </div>`;

code = code.replace(dangerZoneRegex, newDangerZone);

fs.writeFileSync(path, code);
console.log('Profile UI patched.');
