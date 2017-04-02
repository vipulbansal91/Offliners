// var greeting = "hola, ";

chrome.storage.local.get('data', function(data) {
	console.log('Inside content script : ', data.data);
	data.data.some(function(linkObj) {
		if (linkObj.url === document.location.href) {
      console.log('URL Matched: ', linkObj.url);
			// Fire event with the downloadId to search and download this file.
		}
	});
});

var title = document.getElementById("articleTitle");
// document.querySelector('articleTitle')
title.innerHTML = '<button id="saveOfflineButton">Save</button>' + title.innerHTML;
document.getElementById('saveOfflineButton').addEventListener('click', function(event) {
	// alert('Clicked me');
	var nestedLinks = document.querySelectorAll('#articleContent a');
	var linksResult = [];
	nestedLinks.forEach(function(link) {
		if (linksResult.indexOf(link.href) === -1) {
			linksResult.push(link.href);
		}
	});
	var data = {links: linksResult};
	// alert('Sending message: ', data.nestedLinks);
	console.log(data);
	chrome.runtime.sendMessage(data, function(response) {
		//alert('done');
	});
});


// chrome.runtime.sendMessage({links: linksResult}, function(response) {
// 	alert('done');
// });
