import fs from 'fs';

function patchFile(path, replacements) {
    let content = fs.readFileSync(path, 'utf8');
    for (const [target, replacement] of replacements) {
        if (content.includes(target)) {
            content = content.replace(target, replacement);
            console.log(`Patched ${path} for ${target.slice(0, 20)}...`);
        } else {
            console.log(`MISSING in ${path}: ${target.slice(0, 20)}...`);
        }
    }
    fs.writeFileSync(path, content);
}

// Profile.tsx
patchFile('src/pages/Profile.tsx', [
    [
        "alert(isKa ? 'პროფილის სურათი განახლდა' : 'Avatar updated successfully');",
        "setToast({ message: isKa ? 'პროფილის სურათი განახლდა' : 'Avatar updated successfully', type: 'success' });"
    ],
    [
        "alert(isKa ? 'შეცდომა სურათის ატვირთვისას' : 'Failed to upload avatar');",
        "setToast({ message: isKa ? 'შეცდომა სურათის ატვირთვისას' : 'Failed to upload avatar', type: 'error' });"
    ],
    [
        "      </div>\n    </div>\n  );\n}",
        "      </div>\n      <AnimatePresence>\n        {toast && (\n          <Toast \n            message={toast.message} \n            type={toast.type} \n            onClose={() => setToast(null)} \n          />\n        )}\n      </AnimatePresence>\n    </div>\n  );\n}"
    ]
]);

// AddTourWizard.tsx
patchFile('src/pages/AddTourWizard.tsx', [
    [
        "import { Tour, createTour, updateTour } from '../api';",
        "import { Tour, createTour, updateTour } from '../api';\nimport Toast from '../components/Toast';"
    ],
    [
        "const [loading, setLoading] = useState(false);",
        "const [loading, setLoading] = useState(false);\n  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);"
    ],
    [
        "alert(isKa ? `ტურის შენახვა ვერ მოხერხდა: ${msg}` : `Failed to save tour: ${msg}`);",
        "setToast({ message: isKa ? `ტურის შენახვა ვერ მოხერხდა: ${msg}` : `Failed to save tour: ${msg}`, type: 'error' });"
    ],
    [
        "      {/* Success Toast / Modal */}",
        "      <AnimatePresence>\n        {toast && (\n          <Toast \n            message={toast.message} \n            type={toast.type} \n            onClose={() => setToast(null)} \n          />\n        )}\n      </AnimatePresence>\n\n      {/* Success Toast / Modal */}"
    ]
]);

console.log('Final Polish Applied.');
