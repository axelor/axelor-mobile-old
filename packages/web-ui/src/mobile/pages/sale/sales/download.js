import ons from 'onsenui';

export function openFile(fileURL, fileType) {
  ons.ready(() => {
      window.cordova.plugins.fileOpener2.open(
        decodeURIComponent(fileURL),
        fileType,
        {
          error: (err) => console.log('file open error', JSON.stringify(err)),
          success: () => console.log('file open success', fileURL, fileType),
        }
      )
  });
}

export function downloadFile (fileURL, fileName="test.pdf") {
  return new Promise((resolve, reject) => {
    ons.ready(() => {
        const assetURL = fileURL;
        if(window.cordova) {
          var store = window.cordova.file[ons.platform.isIOS() ? 'documentsDirectory' : 'externalApplicationStorageDirectory'];

          var fileTransfer = new window.FileTransfer();

          fileTransfer.download(assetURL, store + fileName,
            function(entry) {
              resolve(entry);
              console.log("Success!", entry);
            },
            function(err) {
              console.log("Error");
              console.dir(err);
              reject(err);
            }
          );
        }
      });
    });
}
