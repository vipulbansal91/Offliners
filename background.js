// alert('background.js')

var tabsToSave = [];
var tabsToClose = [];

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
		console.log(data.data);
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
		tabsToSave.push(flushHttpOrHttps(tabUrl));
		tabsToClose.push(flushHttpOrHttps(tabUrl));
	});
}

chrome.tabs.onUpdated.addListener(function(tabId , info, tab) {
    if (info.status == "complete") {
        // your code ...
        var tabUrl = tab.url;
        
        console.log(tabUrl + " got fully loaded");

        if (tabsToSave.indexOf(flushHttpOrHttps(tabUrl)) > -1) {

        	tabsToSave.splice(tabsToSave.indexOf(flushHttpOrHttps(tabUrl)),1);

        	chrome.pageCapture.saveAsMHTML({
	        	tabId: tab.id
		    }, 	function(blob) {
		        var url = URL.createObjectURL(blob);
				console.log('url: ', url);
				var filename = tabUrl.slice(31).replace('/', '.') + '.mhtml';

		        chrome.downloads.download({
		            url: url,
		            filename: filename
		        }, function(downloadId) {

		        	if (tabsToClose.indexOf(flushHttpOrHttps(tabUrl)) > -1) {

		        		chrome.tabs.remove(tab.id); // to close the tab
		        		tabsToClose.splice(tabsToClose.indexOf(flushHttpOrHttps(tabUrl)),1);
		        	}

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

function flushHttpOrHttps(url) {
	return url.substring(url.indexOf(":") + 1);
}