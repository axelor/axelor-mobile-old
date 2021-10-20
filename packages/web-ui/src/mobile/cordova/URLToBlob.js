export const URLToBlob = (url) => {
  return new Promise((resolve) => {
    if(!url) {
      resolve({ status: 0, message: 'url must not be null' });
    }
    var filename = url.substring(url.lastIndexOf('/')+1);
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'blob';
    request.onload = function() {
      const blob = request.response;
      const file = { name: filename, type: blob.type, size: blob.size };
      resolve({ status: 1, file, blob });
    };
    request.send();
  })
}
