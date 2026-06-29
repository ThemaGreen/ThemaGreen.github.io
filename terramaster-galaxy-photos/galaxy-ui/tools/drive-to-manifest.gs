/**
 * Google Apps Script — turn a Drive folder into manifest.json (NO API key needed).
 *
 * Setup:
 *  1. Make your Drive folder shared "Anyone with the link → Viewer".
 *  2. Go to https://script.google.com → New project. Paste this whole file.
 *  3. Put your folder id below (the part after /folders/ in the folder URL).
 *  4. Run buildManifest() once. Approve the permission prompt (your own account).
 *  5. It writes "manifest.json" to your Drive (My Drive root). Download it and
 *     drop it into the app's dist/ folder before pushing to GitHub Pages.
 *  Re-run anytime you add photos to refresh the gallery.
 */

var FOLDER_ID = 'PASTE_YOUR_FOLDER_ID_HERE';

function buildManifest() {
  var items = [];
  var stack = [{ folder: DriveApp.getFolderById(FOLDER_ID), album: 'Family Album' }];

  while (stack.length) {
    var cur = stack.pop();

    var subs = cur.folder.getFolders();
    while (subs.hasNext()) { var sf = subs.next(); stack.push({ folder: sf, album: sf.getName() }); }

    var files = cur.folder.getFiles();
    while (files.hasNext()) {
      var f = files.next();
      var mt = f.getMimeType() || '';
      var isImg = mt.indexOf('image/') === 0;
      var isVid = mt.indexOf('video/') === 0;
      if (!isImg && !isVid) continue;
      var id = f.getId();
      items.push({
        id: id,
        name: f.getName(),
        type: isVid ? 'VIDEO' : 'IMAGE',
        src: isVid ? '' : 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1600',
        thumb: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w500',
        preview: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1600',
        embed: isVid ? 'https://drive.google.com/file/d/' + id + '/preview' : null,
        date: f.getDateCreated().toISOString(),
        album: cur.album
      });
    }
  }

  items.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
  var json = JSON.stringify({ items: items });

  // overwrite an existing manifest.json if present, else create it
  var existing = DriveApp.getFilesByName('manifest.json');
  if (existing.hasNext()) existing.next().setContent(json);
  else DriveApp.createFile('manifest.json', json, 'application/json');

  Logger.log('Wrote manifest.json with ' + items.length + ' items to your Drive (My Drive).');
}
