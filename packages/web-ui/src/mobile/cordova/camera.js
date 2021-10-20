export const openCamera = isCamera => {
  return new Promise(resolve => {
    if (window.navigator.camera) {
      const picSource = window.navigator.camera.PictureSourceType;
      const sourceType = isCamera ? picSource.CAMERA : picSource.PHOTOLIBRARY;
      window.navigator.camera.getPicture(onSuccess, onFail, { quality: 50,
        sourceType: sourceType,
        destinationType: window.navigator.camera.DestinationType.FILE_URI });

    function onSuccess(imageURI) {
      resolve({ status: 1, image: imageURI });
    }

    function onFail(message) {
      resolve({ status: 0, message: message });
    }

    } else {
      resolve({ status: 0, message: "camera not found" });
    }
  });
};
