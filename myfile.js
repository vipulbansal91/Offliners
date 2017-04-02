// var greeting = "hola, ";

// console.log('Inside contetn script');


var title = document.getElementById("articleTitle");
// document.querySelector('articleTitle')
title.innerHTML = '<button id="saveOfflineButton">Save</button>' + title.innerHTML;
document.getElementById('saveOfflineButton').addEventListener('click', function(event) {
	// alert('Clicked me');
	var nestedLinks = document.querySelectorAll('#articleContent a');
	var linksResult = [];
	linksResult.push(document.location.href);

	nestedLinks.forEach(function(link) {
		if (linksResult.indexOf(link.href) === -1) {
			linksResult.push(link.href);
		}
	});

	linksResult = filterHash(linksResult);

	var data = {links: linksResult};
	// alert('Sending message: ', data.nestedLinks);
	console.log(data);
	chrome.runtime.sendMessage(data, function(response) {
		//alert('done');
	});
});

function filterHash(links) {
	var newLinks = [];

	links.forEach(function(link, index) {
		if (link.indexOf('#') > -1) {
			link = link.substring(0, link.indexOf('#'));
		}

		newLinks.push(link)
	});

	return newLinks.filter(onlyUnique);
}

function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}


// chrome.runtime.sendMessage({links: linksResult}, function(response) {
// 	alert('done');
// });
