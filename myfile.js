// var greeting = "hola, ";

console.log('Inside contetn script');


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
