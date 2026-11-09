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

function buildBreadcrumb(path, winId) {
    var parts = path.replace(/\//g, '\\').split('\\').filter(function(p) { return p !== ''; });
    var html = '';
    var displayNames = { 'C:': 'Local Disk (C:)', 'Users': 'Users' };

    var pathSoFar = '';
    for (var i = 0; i < parts.length; i++) {
        if (i > 0) html += '<span class="explorer-bc-sep"><span class="material-symbols-rounded">chevron_right</span></span>';
        pathSoFar += (i === 0 ? '' : '\\') + parts[i];
        var display = displayNames[parts[i]] || parts[i];
        var escapedP = pathSoFar.replace(/\\/g, '\\\\');
        html += '<span class="explorer-bc-seg" onclick="window.vfsState.goTo(\'' + winId + '\',\'' + escapedP + '\')">' + display + '</span>';
    }
    return html;
}

function getAddressBarIcon(path) {
    var lastPart = path.split('\\').filter(function(p) { return p !== ''; }).pop();
    if (lastPart && folderIconMap[lastPart]) return './img/icon/win/' + folderIconMap[lastPart] + '-sm.png';
    if (path === 'C:') return './img/icon/win/disk-sm.png';
    return './img/icon/win/folder-sm.png';
}

function buildNavItem(icon, label, path, winId, opts) {
    opts = opts || {};
    var isActive = currentVfsPath === path;
    var hasChildren = false;
    if (path) {
        var node = getVfsNode(path);
        if (node && node.type === 'dir') {
            var childKeys = Object.keys(node.children);
            for (var k = 0; k < childKeys.length; k++) {
                if (node.children[childKeys[k]].type === 'dir') { hasChildren = true; break; }
            }
        }
    }

    var arrowClass = 'exp-arrow' + (hasChildren ? '' : ' invisible') + (opts.open ? ' rotated' : '');
    var titleClass = 'exp-droptitle' + (isActive ? ' active' : '');
    var escapedPath = path ? path.replace(/\\/g, '\\\\') : '';

    var html = '<div class="exp-dropdown">';
    html += '<div class="' + titleClass + '" onclick="window.vfsState.goTo(\'' + winId + '\', \'' + escapedPath + '\')">';

    if (hasChildren) {
        html += '<span class="' + arrowClass + '" onclick="event.stopPropagation(); explorerToggleTree(this, \'' + winId + '\', \'' + escapedPath + '\')">&#9654;</span>';
    } else {
        html += '<span class="exp-arrow invisible">&#9654;</span>';
    }

    html += '<img class="exp-nav-icon" src="./img/icon/win/' + icon + '-sm.png" onerror="this.src=\'./img/icon/win/folder-sm.png\'">';
    html += '<span class="exp-nav-label">' + label + '</span>';

    if (opts.pinned) {
        html += '<span class="material-symbols-rounded exp-pin-icon" style="font-size:12px;">push_pin</span>';
    }

    html += '</div>';

    if (opts.open && hasChildren) {
        html += '<div class="exp-dropcontent">';
        var node = getVfsNode(path);
        var keys = Object.keys(node.children);
        for (var c = 0; c < keys.length; c++) {
            if (node.children[keys[c]].type === 'dir') {
                var childIcon = folderIconMap[keys[c]] || 'folder';
                html += buildNavItem(childIcon, keys[c], path + '\\' + keys[c], winId, {});
            }
        }
        html += '</div>';
    }

    html += '</div>';
    return html;
}

function explorerToggleTree(arrowEl, winId, path) {
    var dropdown = arrowEl.closest('.exp-dropdown');
    var content = dropdown.querySelector(':scope > .exp-dropcontent');

    if (content) {
        content.remove();
        arrowEl.classList.remove('rotated');
    } else {
        arrowEl.classList.add('rotated');
        var node = getVfsNode(path);
        if (node && node.type === 'dir') {
            var newContent = document.createElement('div');
            newContent.className = 'exp-dropcontent';
            var keys = Object.keys(node.children);
            for (var c = 0; c < keys.length; c++) {
                if (node.children[keys[c]].type === 'dir') {
                    var childIcon = folderIconMap[keys[c]] || 'folder';
                    newContent.innerHTML += buildNavItem(childIcon, keys[c], path + '\\' + keys[c], winId, {});
                }
            }
            dropdown.appendChild(newContent);
        }
    }
}

function closeExplorerContextMenu() {
    var old = document.querySelector('.explorer-ctx-menu');
    if (old) old.remove();
}

function showExplorerContextMenu(e, winId, itemName) {
    e.preventDefault();
    e.stopPropagation();
    closeExplorerContextMenu();

    var menu = document.createElement('div');
    menu.className = 'explorer-ctx-menu';

    if (itemName) {
        var isDir = false;
        var node = getVfsNode(currentVfsPath);
        if (node && node.children && node.children[itemName] && node.children[itemName].type === 'dir') isDir = true;

        if (isDir) {
            menu.innerHTML =
                '<div class="explorer-ctx-item" onclick="window.vfsState.open(\'' + winId + '\',\'' + itemName.replace(/'/g, "\\'") + '\'); closeExplorerContextMenu()"><span class="material-symbols-rounded">folder_open</span>Open</div>' +
                '<div class="explorer-ctx-sep"></div>';
        }
        menu.innerHTML +=
            '<div class="explorer-ctx-item" onclick="explorerCut(\'' + winId + '\',\'' + itemName.replace(/'/g, "\\'") + '\')"><img src="./img/icon/ui/cut.png">Cut</div>' +
            '<div class="explorer-ctx-item" onclick="explorerCopy(\'' + winId + '\',\'' + itemName.replace(/'/g, "\\'") + '\')"><img src="./img/icon/ui/copy.png">Copy</div>' +
            '<div class="explorer-ctx-sep"></div>' +
            '<div class="explorer-ctx-item" onclick="explorerRename(\'' + winId + '\',\'' + itemName.replace(/'/g, "\\'") + '\')"><img src="./img/icon/ui/rename.png">Rename</div>' +
            '<div class="explorer-ctx-item" onclick="explorerDelete(\'' + winId + '\',\'' + itemName.replace(/'/g, "\\'") + '\')"><span class="material-symbols-rounded" style="color:#c42b1c;">delete</span>Delete</div>';
    } else {
        menu.innerHTML =
            '<div class="explorer-ctx-item" onclick="window.vfsState.newFolder(\'' + winId + '\'); closeExplorerContextMenu()"><img src="./img/icon/ui/new.png">New folder</div>' +
            '<div class="explorer-ctx-item" onclick="explorerNewFile(\'' + winId + '\'); closeExplorerContextMenu()"><span class="material-symbols-rounded">note_add</span>New text document</div>' +
            '<div class="explorer-ctx-sep"></div>';
        if (explorerClipboard) {
            menu.innerHTML += '<div class="explorer-ctx-item" onclick="explorerPaste(\'' + winId + '\'); closeExplorerContextMenu()"><img src="./img/icon/ui/paste.png">Paste</div>' +
                '<div class="explorer-ctx-sep"></div>';
        }
        menu.innerHTML +=
            '<div class="explorer-ctx-item" onclick="window.vfsState.renderExplorer(\'' + winId + '\'); closeExplorerContextMenu()"><span class="material-symbols-rounded">refresh</span>Refresh</div>' +
            '<div class="explorer-ctx-sep"></div>' +
            '<div class="explorer-ctx-item" onclick="closeExplorerContextMenu()"><span class="material-symbols-rounded">info</span>Properties</div>';
    }

    document.body.appendChild(menu);
    var x = e.clientX, y = e.clientY;
    if (x + menu.offsetWidth > window.innerWidth) x = window.innerWidth - menu.offsetWidth - 4;
    if (y + menu.offsetHeight > window.innerHeight) y = window.innerHeight - menu.offsetHeight - 4;
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
}

function explorerCut(winId, name) {
    explorerClipboard = { mode: 'cut', path: currentVfsPath, names: [name] };
    closeExplorerContextMenu();
}

function explorerCopy(winId, name) {
    explorerClipboard = { mode: 'copy', path: currentVfsPath, names: [name] };
    closeExplorerContextMenu();
}

function explorerPaste(winId) {
    if (!explorerClipboard) return;
    var srcParent = getVfsNode(explorerClipboard.path);
    var dstParent = getVfsNode(currentVfsPath);
    if (!srcParent || !dstParent || dstParent.type !== 'dir') return;

    for (var i = 0; i < explorerClipboard.names.length; i++) {
        var n = explorerClipboard.names[i];
        if (!srcParent.children[n]) continue;
        var newName = n;
        if (dstParent.children[newName] && explorerClipboard.mode === 'copy') {
            newName = n + ' - Copy';
        }
        dstParent.children[newName] = JSON.parse(JSON.stringify(srcParent.children[n]));
        if (explorerClipboard.mode === 'cut') {
            delete srcParent.children[n];
        }
    }
    if (explorerClipboard.mode === 'cut') explorerClipboard = null;
    window.vfsState.renderExplorer(winId);
}

function explorerRename(winId, name) {
    closeExplorerContextMenu();
    var newName = prompt('Rename to:', name);
    if (!newName || newName === name) return;
    var parent = getVfsNode(currentVfsPath);
    if (!parent || !parent.children[name]) return;
    if (parent.children[newName]) { alert('An item with that name already exists.'); return; }
    parent.children[newName] = parent.children[name];
    delete parent.children[name];
    window.vfsState.renderExplorer(winId);
}

