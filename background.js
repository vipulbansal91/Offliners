var tabsToSave = [];
var tabsToClose = [];
var trackedDownloadIds = [];

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url:
                "from the extension");
    console.log(sender.tab);
    var linksToSave = request.links;
    console.log(linksToSave);

    var link = linksToSave[0];

    linksToSave.forEach(function(link, index) {
      console.log('Calling savePages with link: ', link);
    	savePages(link);
    });

	doneSaving();

  });


function createLinkObjectToStore(url, filename, downloadId, blob) {
	// console.log(url);
	return {
		url: url,
		name: url,
		location: filename,
		downloadId: downloadId,
    blob: blob
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
		      }, 	function(blob) {
            console.log(blob);
		        var url = URL.createObjectURL(blob);
				//console.log('url: ', url);
				  var filename = Math.random().toString(36).slice(2) + '.mhtml';

		        chrome.downloads.download({
		            url: url,
		            filename: filename
		        }, function(downloadId) {

		        	if (tabsToClose.indexOf(tabId) > -1) {

		        		chrome.tabs.remove(tab.id); // to close the tab
		        		tabsToClose.splice(tabsToClose.indexOf(tabId),1);
		        	}

              console.log('Saving to storage: ', tabUrl, filename);

		        	saveLinkToStorage(createLinkObjectToStore(tabUrl, filename, downloadId, btoa(blob)));
		        });
		    });
        }

        return;
        
    }
});

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
		data.data.some(function(linkObject, index) {
      // console.log('Found');
			if (linkObject.downloadId == downloadId) {
				console.log(linkObject.downloadId + " " + filename);
				linkObject.filename = filename;
        return true;
			}
		});

		console.log(data.data);

		chrome.storage.local.set({'data': data.data});

	});
}

function flushHttpOrHttps(url) {
	return url.substring(url.indexOf(":") + 1);
}
