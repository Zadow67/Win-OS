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

