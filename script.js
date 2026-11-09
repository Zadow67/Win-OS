var VFS = {
    'C:': {
        type: 'dir',
        children: {
            'Users': {
                type: 'dir',
                children: {
                    'Anup': {
                        type: 'dir',
                        children: {
                            'Desktop': { type: 'dir', children: { 'anupsharma12.com.np.lnk': { type: 'file', content: 'link' } } },
                            'Documents': { type: 'dir', children: { 'notes.txt': { type: 'file', content: 'Welcome to WinOS Explorer!\n\nThis is a fully functional virtual file system.\nTry using the Terminal to navigate here and read this file.' } } },
                            'Downloads': { type: 'dir', children: { 'installer.exe': { type: 'file', content: '[binary data]' }, 'Cheats++.exe': { type: 'file', content: '[binary data]' } } },
                            'Pictures': { type: 'dir', children: { 'wallpaper.jpg': { type: 'file', content: '[image data]' } } },
                            'Music': { type: 'dir', children: { 'playlist.m3u': { type: 'file', content: '[playlist]' } } },
                            'Videos': { type: 'dir', children: {} },
                            'Projects': {
                                type: 'dir', children: {
                                    'TicTacToe.lnk': { type: 'file', content: 'link' },
                                    'Typing.lnk': { type: 'file', content: 'link' },
                                    'Quiz.lnk': { type: 'file', content: 'link' },
                                    'Snake.lnk': { type: 'file', content: 'link' }
                                }
                            }
                        }
                    }
                }
            },
            'WinOS': { type: 'dir', children: { 'System32': { type: 'dir', children: {} } } }
        }
    }
};



var currentVfsPath = 'C:\\Users\\Anup';
var terminalPath = 'C:\\Users\\Anup';
var winCount = 0;
var topZ = 100;
var wallpaperChoices = [];

var activeWallpaper = 'img/wallpapers/1.jpg';

for (var wallpaperIndex = 1; wallpaperIndex <= 8; wallpaperIndex++) {
    wallpaperChoices.push('img/wallpapers/' + wallpaperIndex + '.jpg');
}




function toWinPath(p) {
    return p.replace(/\//g, '\\');
}

function toUnixPath(p) {
    return p.replace(/\\/g, '/');
}

function getChildKey(parent, name) {
    if (!parent || parent.type !== 'dir' || !parent.children) return null;
    if (parent.children[name]) return name;

    var keys = Object.keys(parent.children);
    var needle = name.toLowerCase();
    for (var i = 0; i < keys.length; i++) {
        if (keys[i].toLowerCase() === needle) return keys[i];
    }
    return null;
}

function getChildNode(parent, name) {
    var key = getChildKey(parent, name);
    return key ? parent.children[key] : null;
}

function getVfsNode(winPath) {
    var parts = toUnixPath(winPath).split('/').filter(function (p) { return p !== ''; });
    if (parts.length === 0) return null;
    var root = parts[0];
    if (root === 'C:' && VFS['C:']) {
        var node = VFS['C:'];
        for (var i = 1; i < parts.length; i++) {
            node = getChildNode(node, parts[i]);
            if (!node) return null;
        }
        return node;
    }
    return null;
}

function normalizeVfsPath(winPath) {
    var parts = toUnixPath(winPath).split('/').filter(function (p) { return p !== ''; });
    if (parts.length === 0) return winPath;
    if (parts[0] !== 'C:' || !VFS['C:']) return winPath;

    var node = VFS['C:'];
    var out = ['C:'];
    for (var i = 1; i < parts.length; i++) {
        var key = getChildKey(node, parts[i]);
        if (!key) break;
        out.push(key);
        node = node.children[key];
    }
    return toWinPath(out.join('/'));
}

function resolvePath(basePath, relativePath) {
    if (!relativePath) return basePath;
    var rel = toUnixPath(relativePath);
    if (rel.match(/^[A-Z]:/i)) return toWinPath(rel);
    var base = toUnixPath(basePath);
    var combined = base + '/' + rel;
    var parts = combined.split('/');
    var result = [];
    for (var i = 0; i < parts.length; i++) {
        if (parts[i] === '' || parts[i] === '.') continue;
        if (parts[i] === '..') {
            if (result.length > 1) result.pop();
        } else {
            result.push(parts[i]);
        }
    }
    return toWinPath(result.join('/'));
}


var explorerHistory = [];
var explorerHistoryIdx = -1;
var explorerViewMode = 'medium'; 
var explorerSelectedItems = [];
var explorerClipboard = null; 

function explorerPushHistory(path) {
    if (explorerHistory[explorerHistoryIdx] === path) return;
    explorerHistory.splice(explorerHistoryIdx + 1);
    explorerHistory.push(path);
    explorerHistoryIdx = explorerHistory.length - 1;
}

var folderIconMap = {
    'Desktop': 'desk',
    'Documents': 'docs',
    'Downloads': 'down',
    'Pictures': 'pics',
    'Music': 'music',
    'Videos': 'vid',
    'OneDrive': 'onedrive',
    'This PC': 'thispc',
    'Quick access': 'star',
    'Home': 'user'
};

function getFileIconHTML(name, isDir, size) {
    size = size || 48;
    if (isDir) {
        var folderImg = folderIconMap[name] || 'folder';
        return '<img class="exp-file-icon" src="./img/icon/win/' + folderImg + '.png" width="' + size + '" height="' + size + '">';
    }
    var ext = name.split('.').pop().toLowerCase();
    var iconMap = {
        'txt': 'docs', 'doc': 'docs', 'docx': 'docs', 'pdf': 'docs',
        'jpg': 'pics', 'jpeg': 'pics', 'png': 'pics', 'gif': 'pics', 'bmp': 'pics', 'svg': 'pics',
        'mp3': 'music', 'wav': 'music', 'flac': 'music', 'ogg': 'music', 'm3u': 'music',
        'mp4': 'vid', 'avi': 'vid', 'mkv': 'vid', 'mov': 'vid', 'wmv': 'vid'
    };
    if (iconMap[ext]) return '<img class="exp-file-icon" src="./img/icon/win/' + iconMap[ext] + '.png" width="' + size + '" height="' + size + '">';
    if (ext === 'exe') return '<span class="material-symbols-rounded" style="font-size:' + size + 'px; color:#0078d4;">deployed_code</span>';
    if (ext === 'lnk') return '<span class="material-symbols-rounded" style="font-size:' + size + 'px; color:#666;">link</span>';
    return '<img class="exp-file-icon" src="./img/icon/win/docs.png" width="' + size + '" height="' + size + '">';
}

function getSmallIcon(name, isDir) {
    if (isDir) {
        var folderImg = folderIconMap[name] || 'folder';
        return '<img src="./img/icon/win/' + folderImg + '-sm.png" onerror="this.src=\'./img/icon/win/folder-sm.png\'" width="18" height="18">';
    }
    return getFileIconHTML(name, false, 18);
}

