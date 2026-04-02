import fs from 'fs';
let content = fs.readFileSync('src/api.ts', 'utf8');

content = content.replace(
    /const publicUrl = await uploadFileToSupabase\(file, 'avatars'\);\s*galleryUrls\.push\(data\.publicUrl\);/g,
    "const url = await uploadFileToSupabase(file, 'tours');\n            galleryUrls.push(url);"
);

fs.writeFileSync('src/api.ts', content);
console.log('Fixed gallery urls.');
