export const scanCode = () => {
  return new Promise(resolve => {
    if(window.cordova) {
      window.cordova.plugins.barcodeScanner.scan(
        function (result) {
          resolve({ status: 1, result });
        },
        function (error) {
            resolve({ status: 0, message: error.message || 'Something goes wrong' });
        },
        {
            showTorchButton : true,
            torchOn: false,
            prompt : "Place a barcode inside the scan area",
            resultDisplayDuration: 500,
            disableSuccessBeep: false
        }
      );
    } else {
      resolve({ status: 0, message: "scanner not found" });
    }
  });
}
