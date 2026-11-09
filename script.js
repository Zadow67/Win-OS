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

function explorerDelete(winId, name) {
    closeExplorerContextMenu();
    var parent = getVfsNode(currentVfsPath);
    if (!parent || !parent.children[name]) return;
    delete parent.children[name];
    window.vfsState.renderExplorer(winId);
}

function explorerNewFile(winId) {
    var parent = getVfsNode(currentVfsPath);
    if (!parent || parent.type !== 'dir') return;
    var name = 'New Text Document.txt';
    var idx = 1;
    while (parent.children[name]) { name = 'New Text Document (' + idx + ').txt'; idx++; }
    parent.children[name] = { type: 'file', content: '' };
    window.vfsState.renderExplorer(winId);
}

function explorerSelectItem(el, name, e) {
    if (!e.ctrlKey) {
        var items = el.closest('.explorer-content-wrap').querySelectorAll('.explorer-file-item.selected, .explorer-details-row.selected');
        for (var i = 0; i < items.length; i++) items[i].classList.remove('selected');
        explorerSelectedItems = [];
    }
    el.classList.toggle('selected');
    var idx = explorerSelectedItems.indexOf(name);
    if (idx >= 0) explorerSelectedItems.splice(idx, 1);
    else explorerSelectedItems.push(name);
}

function formatFileDate() {
    var d = new Date();
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear() + ' ' +
        (d.getHours() % 12 || 12) + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes() + ' ' + (d.getHours() >= 12 ? 'PM' : 'AM');
}

function getFileType(name, isDir) {
    if (isDir) return 'File folder';
    var ext = name.split('.').pop().toLowerCase();
    var types = { 'txt': 'Text Document', 'doc': 'Document', 'exe': 'Application', 'lnk': 'Shortcut',
        'jpg': 'JPEG Image', 'png': 'PNG Image', 'mp3': 'MP3 Audio', 'mp4': 'MP4 Video',
        'm3u': 'Playlist File', 'pdf': 'PDF Document' };
    return types[ext] || (ext.toUpperCase() + ' File');
}

window.vfsState = {
    renderExplorer: function (winId) {
        if (explorerHistoryIdx < 0) explorerPushHistory(currentVfsPath);

        var node = getVfsNode(currentVfsPath);

        var ribbon = '<div class="explorer-ribbon">' +
            '<div class="explorer-ribbon-sec">' +
            '<button class="explorer-ribbon-btn primary" onclick="window.vfsState.newFolder(\'' + winId + '\')" title="New folder"><img src="./img/icon/ui/new.png"><span>New</span></button>' +
            '</div>' +
            '<div class="explorer-ribbon-sec">' +
            '<button class="explorer-ribbon-btn" onclick="explorerCut(\'' + winId + '\', explorerSelectedItems[0])" title="Cut (Ctrl+X)"><img src="./img/icon/ui/cut.png"></button>' +
            '<button class="explorer-ribbon-btn" onclick="explorerCopy(\'' + winId + '\', explorerSelectedItems[0])" title="Copy (Ctrl+C)"><img src="./img/icon/ui/copy.png"></button>' +
            '<button class="explorer-ribbon-btn" onclick="explorerPaste(\'' + winId + '\')" title="Paste (Ctrl+V)"><img src="./img/icon/ui/paste.png"></button>' +
            '<button class="explorer-ribbon-btn" onclick="if(explorerSelectedItems[0]) explorerRename(\'' + winId + '\', explorerSelectedItems[0])" title="Rename (F2)"><img src="./img/icon/ui/rename.png"></button>' +
            '<button class="explorer-ribbon-btn" title="Share"><img src="./img/icon/ui/share.png"></button>' +
            '<button class="explorer-ribbon-btn" onclick="if(explorerSelectedItems[0]) explorerDelete(\'' + winId + '\', explorerSelectedItems[0])" title="Delete (Del)"><span class="material-symbols-rounded" style="font-size:16px; color:#c42b1c;">delete</span></button>' +
            '</div>' +
            '<div class="explorer-ribbon-sec">' +
            '<button class="explorer-ribbon-btn" title="Sort"><img src="./img/icon/ui/sort.png"><span>Sort</span></button>' +
            '<button class="explorer-ribbon-btn" title="View" onclick="explorerCycleView(\'' + winId + '\')"><img src="./img/icon/ui/view.png"><span>View</span></button>' +
            '</div>' +
            '<button class="explorer-ribbon-more" title="See more">&#8943;</button>' +
            '</div>';

        var canBack = explorerHistoryIdx > 0;
        var canFwd = explorerHistoryIdx < explorerHistory.length - 1;
        var canUp = currentVfsPath.split('\\').filter(function(p) { return p; }).length > 1;

        var addrIcon = getAddressBarIcon(currentVfsPath);
        var breadcrumb = buildBreadcrumb(currentVfsPath, winId);

        var toolbar = '<div class="explorer-toolbar">' +
            '<button class="explorer-nav-btn' + (canBack ? '' : ' disabled') + '" onclick="window.vfsState.goBack(\'' + winId + '\')" title="Back (Alt+Left)"><span class="material-symbols-rounded">arrow_back</span></button>' +
            '<button class="explorer-nav-btn' + (canFwd ? '' : ' disabled') + '" onclick="window.vfsState.goForward(\'' + winId + '\')" title="Forward (Alt+Right)"><span class="material-symbols-rounded">arrow_forward</span></button>' +
            '<button class="explorer-nav-btn' + (canUp ? '' : ' disabled') + '" onclick="window.vfsState.goUp(\'' + winId + '\')" title="Up (Alt+Up)"><span class="material-symbols-rounded">arrow_upward</span></button>' +
            '<div class="explorer-address-bar" onclick="explorerFocusAddress(\'' + winId + '\')">' +
            '<img src="' + addrIcon + '">' +
            '<div class="explorer-breadcrumb" id="' + winId + '-breadcrumb">' +
            '<img class="explorer-breadcrumb-icon" src="' + addrIcon + '">' +
            breadcrumb +
            '</div>' +
            '<input type="text" id="' + winId + '-address" value="' + currentVfsPath + '" onkeydown="if(event.key===\'Enter\'){window.vfsState.goTo(\'' + winId + '\', this.value); explorerBlurAddress(\'' + winId + '\');}" onblur="explorerBlurAddress(\'' + winId + '\')" style="opacity:0; position:absolute; left:0; width:100%; height:100%; padding:0 28px;">' +
            '</div>' +
            '<div class="explorer-search-bar">' +
            '<img src="./img/icon/ui/search.png">' +
            '<input type="text" id="' + winId + '-search" placeholder="Search ' + currentVfsPath.split('\\').pop() + '" oninput="window.vfsState.renderExplorer(\'' + winId + '\')">' +
            '</div>' +
            '</div>';

        var navpane = '<div class="explorer-navpane">';

        navpane += '<div class="exp-section-header">Quick access</div>';
        navpane += buildNavItem('desk', 'Desktop', 'C:\\Users\\Anup\\Desktop', winId, { pinned: true });
        navpane += buildNavItem('down', 'Downloads', 'C:\\Users\\Anup\\Downloads', winId, { pinned: true });
        navpane += buildNavItem('docs', 'Documents', 'C:\\Users\\Anup\\Documents', winId, { pinned: true });
        navpane += buildNavItem('pics', 'Pictures', 'C:\\Users\\Anup\\Pictures', winId, { pinned: true });
        navpane += buildNavItem('music', 'Music', 'C:\\Users\\Anup\\Music', winId, { pinned: true });
        navpane += buildNavItem('vid', 'Videos', 'C:\\Users\\Anup\\Videos', winId, { pinned: true });

        navpane += '<div class="exp-nav-divider"></div>';

        navpane += buildNavItem('onedrive', 'OneDrive', 'C:\\Users\\Anup', winId, {});

        navpane += '<div class="exp-nav-divider"></div>';

        navpane += '<div class="exp-section-header">This PC</div>';
        navpane += buildNavItem('thispc', 'This PC', 'C:', winId, { open: currentVfsPath.split('\\').length <= 2 });

        navpane += '</div>';

        var searchInput = document.getElementById(winId + '-search');
        var searchTxt = searchInput ? searchInput.value.toLowerCase() : '';

        var contentInner = '';
        if (node && node.type === 'dir') {
            var names = Object.keys(node.children);
            var dirs = [], files = [];
            for (var i = 0; i < names.length; i++) {
                if (searchTxt && names[i].toLowerCase().indexOf(searchTxt) === -1) continue;
                if (node.children[names[i]].type === 'dir') dirs.push(names[i]);
                else files.push(names[i]);
            }
            dirs.sort(function(a,b) { return a.toLowerCase().localeCompare(b.toLowerCase()); });
            files.sort(function(a,b) { return a.toLowerCase().localeCompare(b.toLowerCase()); });
            var sorted = dirs.concat(files);

            if (explorerViewMode === 'details') {
                contentInner += '<div class="explorer-details-header">' +
                    '<span class="explorer-details-col-name">Name</span>' +
                    '<span class="explorer-details-col-date">Date modified</span>' +
                    '<span class="explorer-details-col-type">Type</span>' +
                    '<span class="explorer-details-col-size">Size</span>' +
                    '</div>';
                for (var i = 0; i < sorted.length; i++) {
                    var n = sorted[i];
                    var isDir = node.children[n].type === 'dir';
                    var selClass = explorerSelectedItems.indexOf(n) >= 0 ? ' selected' : '';
                    contentInner += '<div class="explorer-details-row' + selClass + '" ' +
                        'onclick="explorerSelectItem(this, \'' + n.replace(/'/g, "\\'") + '\', event)" ' +
                        'ondblclick="window.vfsState.open(\'' + winId + '\',\'' + n.replace(/'/g, "\\'") + '\')" ' +
                        'oncontextmenu="showExplorerContextMenu(event, \'' + winId + '\', \'' + n.replace(/'/g, "\\'") + '\')">' +
                        getSmallIcon(n, isDir) +
                        '<span class="explorer-details-col-name">' + n + '</span>' +
                        '<span class="explorer-details-col-date">' + formatFileDate() + '</span>' +
                        '<span class="explorer-details-col-type">' + getFileType(n, isDir) + '</span>' +
                        '<span class="explorer-details-col-size">' + (isDir ? '' : '1 KB') + '</span>' +
                        '</div>';
                }
            } else {
                var iconSize = explorerViewMode === 'large' ? 64 : 48;
                var gridCols = explorerViewMode === 'large' ? '110px' : '96px';
                var itemsHTML = '';
                for (var i = 0; i < sorted.length; i++) {
                    var n = sorted[i];
                    var isDir = node.children[n].type === 'dir';
                    var selClass = explorerSelectedItems.indexOf(n) >= 0 ? ' selected' : '';
                    itemsHTML += '<div class="explorer-file-item' + selClass + '" style="width:' + gridCols + ';" ' +
                        'onclick="explorerSelectItem(this, \'' + n.replace(/'/g, "\\'") + '\', event)" ' +
                        'ondblclick="window.vfsState.open(\'' + winId + '\',\'' + n.replace(/'/g, "\\'") + '\')" ' +
                        'oncontextmenu="showExplorerContextMenu(event, \'' + winId + '\', \'' + n.replace(/'/g, "\\'") + '\')">' +
                        getFileIconHTML(n, isDir, iconSize) +
                        '<span class="explorer-file-item-name">' + n + '</span></div>';
                }
                contentInner = '<div class="explorer-file-grid" style="grid-template-columns:repeat(auto-fill,' + gridCols + ');">' + itemsHTML + '</div>';
            }

            if (sorted.length === 0) {
                contentInner = searchTxt
                    ? '<div class="explorer-empty">No items match your search.</div>'
                    : '<div class="explorer-empty">This folder is empty.</div>';
            }
        }

        var contentArea = '<div class="explorer-content" tabindex="-1" oncontextmenu="showExplorerContextMenu(event, \'' + winId + '\', null)" onclick="if(event.target===this||event.target.classList.contains(\'explorer-file-grid\')||event.target.classList.contains(\'explorer-content-wrap\')){var s=this.querySelectorAll(\'.selected\');for(var i=0;i<s.length;i++)s[i].classList.remove(\'selected\');explorerSelectedItems=[];}">' +
            '<div class="explorer-content-wrap">' + contentInner + '</div></div>';

        var actualCount = node && node.type === 'dir' ? Object.keys(node.children).length : 0;
        var selCount = explorerSelectedItems.length;
        var statusText = actualCount + ' item' + (actualCount !== 1 ? 's' : '');
        if (selCount > 0) statusText += '  |  ' + selCount + ' selected';

        var statusbar = '<div class="explorer-statusbar">' +
            '<span>' + statusText + '</span>' +
            '<div class="explorer-view-btns">' +
            '<button class="explorer-view-btn' + (explorerViewMode === 'details' ? ' active' : '') + '" title="Details" onclick="explorerViewMode=\'details\'; window.vfsState.renderExplorer(\'' + winId + '\')"><span class="material-symbols-rounded" style="font-size:16px;">view_list</span></button>' +
            '<button class="explorer-view-btn' + (explorerViewMode === 'medium' ? ' active' : '') + '" title="Medium icons" onclick="explorerViewMode=\'medium\'; window.vfsState.renderExplorer(\'' + winId + '\')"><span class="material-symbols-rounded" style="font-size:16px;">grid_view</span></button>' +
            '<button class="explorer-view-btn' + (explorerViewMode === 'large' ? ' active' : '') + '" title="Large icons" onclick="explorerViewMode=\'large\'; window.vfsState.renderExplorer(\'' + winId + '\')"><span class="material-symbols-rounded" style="font-size:16px;">view_module</span></button>' +
            '</div>' +
            '</div>';

        var html = '<div class="explorer-shell">' +
            ribbon + toolbar +
            '<div class="explorer-body">' + navpane + contentArea + '</div>' +
            statusbar +
            '</div>';

        var el = document.getElementById(winId + '-content');
        if (el) el.innerHTML = html;
        return html;
    },

    open: function (winId, name) {
        var path = currentVfsPath + '\\' + name;
        var node = getVfsNode(path);
        if (!node) return;
        if (node.type === 'dir') {
            currentVfsPath = path;
            explorerPushHistory(currentVfsPath);
            explorerSelectedItems = [];
            this.renderExplorer(winId);
        } else if (name.endsWith('.txt')) {
            openFile(name, node.content);
        } else if (name === 'installer.exe') {
            runInstaller('installer.exe');
        } else if (name === 'Cheats++.exe' || name === 'Cheats++.lnk') {
            runInstaller('Cheats++.exe');
        } else if (name === 'TicTacToe.lnk') {
            openApp('TicTacToe', 'img/tictactoe.png');
        } else if (name === 'Typing.lnk') {
            openApp('Typing', 'img/typing.png');
        } else if (name === 'Quiz.lnk') {
            openApp('Quiz', 'img/quiz.png');
        } else if (name === 'Snake.lnk') {
            openApp('Snake', 'img/snake.png');
        } else if (name === 'anupsharma12.com.np' || name === 'anupsharma12.com.np.lnk') {
            window.open('https://anupsharma12.com.np', '_blank');
        } else if (name.endsWith('.jpg') || name.endsWith('.png')) {
            var imgSrc = name === 'wallpaper.jpg' ? 'img/wallpapers/1.jpg' : '';
            if (imgSrc) {
                openImageViewer(name, imgSrc);
            }
        }
    },

    goTo: function (winId, path) {
        var p = path.replace(/\//g, '\\');
        if (getVfsNode(p)) {
            currentVfsPath = p;
            explorerPushHistory(currentVfsPath);
            explorerSelectedItems = [];
            this.renderExplorer(winId);
        }
    },

    goUp: function (winId) {
        var parts = currentVfsPath.split('\\');
        if (parts.length > 1) {
            parts.pop();
            currentVfsPath = parts.join('\\') || 'C:';
            explorerPushHistory(currentVfsPath);
            explorerSelectedItems = [];
            this.renderExplorer(winId);
        }
    },

    goBack: function (winId) {
        if (explorerHistoryIdx > 0) {
            explorerHistoryIdx--;
            currentVfsPath = explorerHistory[explorerHistoryIdx];
            explorerSelectedItems = [];
            this.renderExplorer(winId);
        }
    },

    goForward: function (winId) {
        if (explorerHistoryIdx < explorerHistory.length - 1) {
            explorerHistoryIdx++;
            currentVfsPath = explorerHistory[explorerHistoryIdx];
            explorerSelectedItems = [];
            this.renderExplorer(winId);
        }
    },

    newFolder: function (winId) {
        closeExplorerContextMenu();
        var node = getVfsNode(currentVfsPath);
        if (!node || node.type !== 'dir') return;
        var name = 'New folder';
        var idx = 1;
        while (node.children[name]) { name = 'New folder (' + idx + ')'; idx++; }
        node.children[name] = { type: 'dir', children: {} };
        this.renderExplorer(winId);
    }
};

function explorerFocusAddress(winId) {
    var bc = document.getElementById(winId + '-breadcrumb');
    var inp = document.getElementById(winId + '-address');
    if (bc) bc.style.display = 'none';
    if (inp) { inp.style.opacity = '1'; inp.style.position = 'relative'; inp.style.padding = '0 4px'; inp.focus(); inp.select(); }
}

