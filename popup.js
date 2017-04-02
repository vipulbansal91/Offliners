document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.local.get('data', function(data) {
    console.log('Fetching data:', data.data);
    data.data.forEach(function(linkObj) {
      if (linkObj.isParent) {
        var htmlStr = ('<a style="margin: 3px; display: block;" target="_blank" data-parent=' +
                       linkObj.isParent + ' href="' + linkObj.url + '">' + linkObj.pageTitle + '</a>');
        document.getElementById('links').innerHTML += htmlStr;
      }
    });
  });
});
