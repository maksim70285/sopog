const fs = require('fs');
let code = fs.readFileSync('src/views/ProfileView.tsx', 'utf8');

// replace 1
let target1 = `  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState<boolean>(false);`;
let replacement1 = `  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState<boolean>(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const { loadUser } = useAuth(); // assuming loadUser is in useAuth, if not, window.location.reload()

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setIsUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', e.target.files[0]);
    try {
      await api.uploadAvatar(formData);
      // reload the user session
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarDelete = async () => {
    setIsUploadingAvatar(true);
    try {
      await api.deleteAvatar();
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };`;
code = code.replace(target1, replacement1);

// replace 2
let target2 = `        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-200 shrink-0 border-2 border-white shadow-sm">
            {artist?.avatarUrl ? (
              <img
                src={artist.avatarUrl}
                alt={artist.pseudonym}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400 bg-zinc-100">
                <UserIcon className="w-8 h-8 stroke-1" />
              </div>
            )}
          </div>

          <div className="space-y-1 text-center sm:text-left">`;

let replacement2 = `        <div className="flex items-center gap-5">
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-zinc-200 shrink-0 border-2 border-white shadow-sm group">
              {(user?.avatarUrl || artist?.avatarUrl) ? (
                <img
                  src={user?.avatarUrl || artist?.avatarUrl}
                  alt={artist?.pseudonym || user.login}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400 bg-zinc-100">
                  <UserIcon className="w-8 h-8 stroke-1" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="cursor-pointer p-2">
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={isUploadingAvatar} />
                  <Edit2 className="w-5 h-5 text-white" />
                </label>
              </div>
            </div>
            {(user?.avatarUrl || artist?.avatarUrl) && (
              <button 
                onClick={handleAvatarDelete}
                disabled={isUploadingAvatar}
                className="text-[10px] text-zinc-500 hover:text-red-500 transition-colors"
              >
                Удалить
              </button>
            )}
          </div>

          <div className="space-y-1 text-center sm:text-left">`;

code = code.replace(target2, replacement2);

// account status
let target3 = `            <p className="text-xs text-zinc-500">
              Логин: <span className="font-mono font-medium text-zinc-700">{user.login}</span>
            </p>
          </div>
        </div>`;

let replacement3 = `            <p className="text-xs text-zinc-500">
              Логин: <span className="font-mono font-medium text-zinc-700">{user.login}</span>
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Статус: <span className={\`font-semibold \${user.isBanned ? 'text-red-600' : 'text-green-600'}\`}>
                {user.isBanned ? \`Заблокирован \${user.banReason ? \`(\${user.banReason})\` : ''}\` : 'Активен'}
              </span>
            </p>
          </div>
        </div>`;
code = code.replace(target3, replacement3);

fs.writeFileSync('src/views/ProfileView.tsx', code);
