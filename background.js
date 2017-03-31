// alert('background.js')
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

    var link = linksToSave[0];
    // var index = -1;

	//chrome.tabs.create({'url': link}, function(tab) {
	savePage(link, 0, linksToSave, savePage);
	// });

    // linksToSave.forEach(function(link, index) {
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

function createLinkObjectToStore(url, filename) {
	return {
		url: url,
		name: url,
		location: filename
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

function savePage(tabUrl, index, array, cb) {
	chrome.tabs.create({'url': tabUrl}, function(tab) {
		setTimeout(function() {
		    chrome.pageCapture.saveAsMHTML({
	        tabId: tab.id
	    }, function(blob) {
	        var url = URL.createObjectURL(blob);
			console.log('url: ', url);
			var filename = tabUrl.slice(31).replace('/', '.') + '.mhtml';
	        chrome.downloads.download({
	            url: url,
	            filename: filename
	        }, function() {
	        	saveLinkToStorage(createLinkObjectToStore(tabUrl, filename));
		        chrome.tabs.remove(tab.id); // to close the tab
	        	if (!array || !cb) {
	        		return;
	        	}
	        	if (index < array.length) {
	        		cb(array[index], ++index, array, cb);
	        	}
	        	else {
	        		console.log('Done all calls');
	        		console.log(array, index, cb);
	        		doneSaving();
	        	}
	        });
	    });
		}, 5000);
	});


}