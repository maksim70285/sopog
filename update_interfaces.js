import fs from 'fs';
let code = fs.readFileSync('server/db.ts', 'utf8');
code = code.replace("isAdmin?: boolean;", "isAdmin?: boolean;\n  avatarUrl?: string;");
fs.writeFileSync('server/db.ts', code);

let typesCode = fs.readFileSync('src/types.ts', 'utf8');
typesCode = typesCode.replace("isAdmin?: boolean;", "isAdmin?: boolean;\n  avatarUrl?: string;");
fs.writeFileSync('src/types.ts', typesCode);
