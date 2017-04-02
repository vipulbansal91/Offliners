// alert('background.js')

var tabsToSave = [];
var tabsToClose = [];
var trackedDownloadIds = [];

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url:
                "from the extension");
    console.log(sender.tab);
    // chrome.downloads.download({
    // 	url: sender.tab.url,
    // 	filename: 'xyz'
    // });
   // savePage(sender.tab.url);
    var linksToSave = request.links;
    console.log(linksToSave);

    var link = linksToSave[0];
    // var index = -1;

	//chrome.tabs.create({'url': link}, function(tab) {
	//savePage(link, 0, linksToSave, savePage);
	// });

    linksToSave.forEach(function(link, index) {
      console.log('Calling savePages with link: ', link);
    	savePages(link);
    });

	doneSaving();

    // for(var i = 0; i < linksToSave.length; i++) {
    // 	// if (index )
    // 	var link = linksToSave[i];
    // 	chrome.tabs.create({'url': link}, function(tab) {
    // 		console.log('opened new tab');
    // 		// savePage(tab.id, link, saveNext(link, index));

	   //  // setTimeout(function() {
	   //  // 	// var link = linksToSave[i];
	   //  // 	// chrome.tabs.create({'url': link}, function(tab) {
	   //  // 	// 	console.log('opened new tab');
	   //  // 	// 	savePage(tab.id, link);
		  //  //  	// setTimeout(function() {

		  //  //  	// },);
		  //  //  	// chrome.tabs.remove(tab.id);
	   //  // 	});
	   //  // }, 3000);
    // });
    // }
    // chrome.pageCapture
    // console.log(request.links, sender);
  });

function doneSaving() {
	chrome.storage.local.get('data', function(data) {
		//console.log(data.data);
	});
}

function createLinkObjectToStore(url, filename, downloadId) {
	// console.log(url);
	return {
		url: url,
		name: url,
		location: filename,
		downloadId: downloadId
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

chrome.tabs.onUpdated.addListener(function(tabId , info, tab) {
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
		        var url = URL.createObjectURL(blob);
				//console.log('url: ', url);
				var filename = tabUrl.slice(31).replace('/', '.') + '.mhtml';

		        chrome.downloads.download({
		            url: url,
		            filename: filename
		        }, function(downloadId) {

		        	if (tabsToClose.indexOf(tabId) > -1) {

		        		chrome.tabs.remove(tab.id); // to close the tab
		        		tabsToClose.splice(tabsToClose.indexOf(tabId),1);
		        	}

              console.log('Saving to storage: ', tabUrl, filename);

		        	saveLinkToStorage(createLinkObjectToStore(tabUrl, filename, downloadId));		        	

		        	if (tabsToSave.length == 0) {
		        		doneSaving();
		        	}


		        	// console.log(downloadId, prevDownloadId);

		        	// if (prevDownloadId) {
			        // 	chrome.downloads.search({
			        // 		id: prevDownloadId
			        // 	}, function(results) {
			        // 		console.log(results);
			        // 	});
		        	// }

		        	// prevDownloadId = downloadId;
		        	// 
			        
		        	// if (!array || !cb) {
		        	// 	return;
		        	// }
		        	// if (index < array.length) {
		        	// 	cb(array[index], ++index, array, cb);
		        	// }
		        	// else {
		        	// 	console.log('Done all calls');
		        	// 	// console.log(array, index, cb);
		        	// 	doneSaving();
		        	// }
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
	console.log(downloadId + " " + filename);

	chrome.storage.local.get('data', function(data) {
		
		data.data.forEach(function(linkObject, index) {
			if (linkObject.downloadId == downloadId) {
				console.log(linkObject.downloadId + " " + filename);
				linkObject.filename = filename;
			}
		});

		console.log(data.data);

		chrome.storage.local.set({'data': result});

	});
}

function flushHttpOrHttps(url) {
	return url.substring(url.indexOf(":") + 1);
}
