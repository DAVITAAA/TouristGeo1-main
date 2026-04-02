import fs from 'fs';

let content = fs.readFileSync('src/pages/Profile.tsx', 'utf8');
const anchor = "    </div>\n  );\n}";
const replacement = `      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}`;

if (content.includes(anchor)) {
    content = content.replace(anchor, replacement);
    fs.writeFileSync('src/pages/Profile.tsx', content);
    console.log("Patched Profile.tsx with Toast JSX");
} else {
    // Try CRLF
    const anchor2 = "    </div>\r\n  );\r\n}";
    const replacement2 = `      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}`;
    if (content.includes(anchor2)) {
        content = content.replace(anchor2, replacement2);
        fs.writeFileSync('src/pages/Profile.tsx', content);
        console.log("Patched Profile.tsx with Toast JSX (CRLF)");
    } else {
        console.log("FAILED to find anchor in Profile.tsx");
    }
}
