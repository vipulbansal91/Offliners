(function isAlreadySaved() {

  function saveOrUpdate() {
    var nestedLinks = document.querySelectorAll('#articleContent a');
    if (nestedLinks.length === 0) {
      nestedLinks = document.querySelectorAll('.wikicreatelink a, a.external');
    }
    console.log(nestedLinks);
    var linksResult = [];
    linksResult.push(document.location.href);

    nestedLinks.forEach(function(link) {
      if (linksResult.indexOf(link.href) === -1) {
        console.log('pushing to array');
        linksResult.push(link.href);
      }
    });

    linksResult = filterHash(linksResult);
    console.log('filtered list: ', linksResult);

    var data = {links: linksResult};
    console.log(data);
    chrome.runtime.sendMessage(data, function() {});
  }

  function filterHash(links) {
    var newLinks = [];

    links.forEach(function(link, index) {
      if (link.indexOf('#') > -1) {
        link = link.substring(0, link.indexOf('#'));
      }
      newLinks.push(link);
    });

    return newLinks.filter(function(value, index, self) {
      return self.indexOf(value) === index;
    });
  }


  var title = document.getElementById("articleTitle") || document.getElementById('document-title');
  chrome.storage.local.get('data', function(data) {
    console.log('Fetching data:', data.data);
    var downloadId;
    if (data.data) {
      data.data.some(function(linkObj) {
        if (document.location.href === linkObj.url) {
          downloadId = linkObj.downloadId;
          title.innerHTML = '<button id="updateButton">Update</button>' + title.innerHTML;
          document.getElementById('updateButton').addEventListener('click', saveOrUpdate);
          return true;
        }
      });
    }
    if (!downloadId) {
      title.innerHTML = '<button id="saveOfflineButton">Save</button>' + title.innerHTML;
      document.getElementById('saveOfflineButton').addEventListener('click', saveOrUpdate);
    }
  });
})();

