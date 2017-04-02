var tabsToSave = [];
var tabsToClose = [];
var trackedDownloadIds = [];
var parentUrls = [];

Array.prototype.forEachDone = function(fn, scope, lastfn) {
  for(var i = 0, c = 0, len = this.length; i < len; i++) {
    fn.call(scope, this[i], i, this, function() {
      ++c === len && lastfn();
    });
  }
};

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url:
                "from the extension");
    var linksToSave = [];
    console.log(request.links);

    parentUrls.push(request.links[0]);

    request.links.forEachDone(function(link, i, arr, done){

      console.log(link);

      chrome.storage.local.get('data', function(data) {

        if (link.includes("w.amazon.com") && (link.includes("&action=edit&section=")) == false) {
          found = false;

          console.log(data.data);
          if (data.data) {
            data.data.forEach(function(linkObject, index) {

              if (linkObject.url === link) {
                found = true;
              }
            });
          }


          console.log(found);

          if (found === false) {
            linksToSave.push(link);
          }

          console.log(linksToSave);
        }

        done()

      });


    }, this, function() {
      console.log(linksToSave);

      linksToSave.forEach(function(link, index) {
        savePages(link);
      });
    });


  });


function createLinkObjectToStore(url, filename, downloadId, pageTitle, isParent) {
  return {
    url: url,
    name: url,
    location: filename,
    downloadId: downloadId,
    pageTitle: pageTitle,
    isParent : isParent
  };
}

function saveLinkToStorage(linkObj) {
  chrome.storage.local.get('data', function(res) {
    console.log(res.data);
    if (res && res.data) {
      result = res.data;
    } else {
      result = [];
    }
    result.push(linkObj);
    chrome.storage.local.set({'data': result});
  });
}

function savePages(tabUrl) {
  chrome.tabs.create({'url': tabUrl, 'active': false}, function(tab) {
    tabsToSave.push(tab.id);
    tabsToClose.push(tab.id);
  });
}

function searchAndGetURLFromStore(url, tabId) {
  chrome.storage.local.get('data', function(data) {
    if (data.data) {
      data.data.some(function(linkObj) {
        if (linkObj.url === url) {
          console.log('URL Matched, linkObj: ', linkObj);
          openFileURLInTab("file://" + linkObj.filename, tabId);
          return true;
        }
      });
    }
  });
}

function openFileURLInTab(fileUrl, tabId) {
  console.log('This url to open: ', fileUrl);
  chrome.tabs.update(tabId, {url: fileUrl});
}

function stripTitle(title) {
  if (title.lastIndexOf('/') !== -1) {
    title = title.substr(title.lastIndexOf('/') + 1);
  }
  return title.substr(0, title.lastIndexOf('-') - 1);
}

chrome.tabs.onUpdated.addListener(function(tabId , info, tab) {
  console.log('Inside on updated');
  if (!navigator.onLine) {
    var fileURL = searchAndGetURLFromStore(tab.url, tabId);
  } else {
    console.log('Online');
  }
  if (info.status == "complete") {
    // your code ...
    var tabUrl = tab.url;
    console.log(tabUrl + " got fully loaded");

    console.log('tabsToSave', 'tabsToClose');
    console.log('Got tabUrl: ', tabUrl);
    console.log(tabsToSave.toString(), tabsToClose.toString());
    if (tabsToSave.indexOf(tabId) > -1) {

      tabsToSave.splice(tabsToSave.indexOf(tabId),1);

      chrome.pageCapture.saveAsMHTML({
        tabId: tab.id
      },  function(blob) {
        var pageTitle = stripTitle(tab.title);
        console.log('pageTitle: ', pageTitle);
        var url = URL.createObjectURL(blob);
        //console.log('url: ', url);
        var filename = 'Offliners/' + Math.random().toString(36).slice(2) + '.mhtml';

        chrome.downloads.download({
          url: url,
          filename: filename
        }, function(downloadId) {

          if (tabsToClose.indexOf(tabId) > -1) {

            chrome.tabs.remove(tab.id); // to close the tab
            tabsToClose.splice(tabsToClose.indexOf(tabId),1);
          }

          console.log('Saving to storage: ', tabUrl, filename);

          saveLinkToStorage(createLinkObjectToStore(tabUrl, filename, downloadId, pageTitle, isUrlParent(tabUrl)));
        });
      });
    }

    return;
  }
});

function isUrlParent(url) {
  isParent = false

  if (parentUrls.indexOf(url) > -1) {
    isParent = true;

    parentUrls.splice(parentUrls.indexOf(url), 1);
  }

  return isParent;
}

chrome.downloads.onChanged.addListener(function(downloadDelta) {
  if (downloadDelta.state && downloadDelta.state.current == "complete") {
    chrome.downloads.search({
      id: downloadDelta.id
    }, function(results) {
      updateFileNameInLocalStorage(downloadDelta.id, results[0].filename);
    });
  }
});


function getDownloadFileName(downloadId) {
  chrome.downloads.search({
    id: downloadId
  }, function(results) {
    console.log(results[0]);
    console.log(results[0].filename);
    return results[0].filename;
  });
}

function updateFileNameInLocalStorage(downloadId, filename) {
  console.log('Updating location for file: ', downloadId + " " + filename);

  chrome.storage.local.get('data', function(data) {
    console.log('data: ', data.data);
    if (data.data) {
      data.data.some(function(linkObject, index) {
        // console.log('Found');
        if (linkObject.downloadId == downloadId) {
          console.log(linkObject.downloadId + " " + filename);
          linkObject.filename = filename;
          return true;
        }
      });
    }

    console.log(data.data);

    chrome.storage.local.set({'data': data.data});

  });
}

function flushHttpOrHttps(url) {
  return url.substring(url.indexOf(":") + 1);
}
