import fs from 'fs';
let content = fs.readFileSync('src/api.ts', 'utf8');

const anchor = "sessionStorage.removeItem('auth_token');\n};";
const idx = content.indexOf(anchor);

if (idx !== -1) {
    const p1 = content.slice(0, idx + anchor.length);
    const p2 = content.slice(idx + anchor.length);
    const apiCode = `\n\nexport const deleteAccount = async () => {\n    const token = getToken();\n    if (!token) throw new Error('Not authenticated');\n    \n    const response = await fetch(\`\${API_BASE_URL}/auth/me\`, {\n        method: 'DELETE',\n        headers: { 'Authorization': \`Bearer \${token}\` }\n    });\n    \n    const result = await response.json();\n    if (!response.ok) throw new Error(result.error || 'Failed to delete account');\n    removeToken();\n    return result;\n};\n`;
    fs.writeFileSync('src/api.ts', p1 + apiCode + p2);
    console.log("Injected deleteAccount!");
} else {
    // try different search
    const anchor2 = "sessionStorage.removeItem('auth_token');\r\n};";
    const idx2 = content.indexOf(anchor2);
    if (idx2 !== -1) {
        const p1 = content.slice(0, idx2 + anchor2.length);
        const p2 = content.slice(idx2 + anchor2.length);
        const apiCode = `\r\n\r\nexport const deleteAccount = async () => {\r\n    const token = getToken();\r\n    if (!token) throw new Error('Not authenticated');\r\n    \r\n    const response = await fetch(\`\${API_BASE_URL}/auth/me\`, {\r\n        method: 'DELETE',\r\n        headers: { 'Authorization': \`Bearer \${token}\` }\r\n    });\r\n    \r\n    const result = await response.json();\r\n    if (!response.ok) throw new Error(result.error || 'Failed to delete account');\r\n    removeToken();\r\n    return result;\r\n};\r\n`;
        fs.writeFileSync('src/api.ts', p1 + apiCode + p2);
        console.log("Injected deleteAccount with CRLF!");
    } else {
        console.log("FAILED to find anchor.");
    }
}
