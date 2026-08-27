const fs = require('fs');
let code = fs.readFileSync('server/routes.ts', 'utf8');

const avatarRoutes = `
// POST /api/users/avatar
apiRouter.post('/users/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const user = req.user;
    if (!req.file) {
      res.status(400).json({ error: 'Файл не найден' });
      return;
    }
    const avatarUrl = \`/uploads/avatars/\${req.file.filename}\`;
    
    // Update User
    db.updateUser(user.id, { avatarUrl });
    
    // Update Artist if exists
    const artist = db.findArtistByUserId(user.id);
    if (artist) {
      db.updateArtist(artist.id, { avatarUrl });
    }
    
    res.json({ avatarUrl });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/users/avatar
apiRouter.delete('/users/avatar', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    
    // Update User
    db.updateUser(user.id, { avatarUrl: undefined });
    
    // Update Artist if exists
    const artist = db.findArtistByUserId(user.id);
    if (artist) {
      db.updateArtist(artist.id, { avatarUrl: '' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
`;

code = code.replace("// POST /api/artist/create", avatarRoutes + "\n// POST /api/artist/create");
fs.writeFileSync('server/routes.ts', code);
