export function openFilePicker(onSelectFile) { 
    const FilePicker = window.FilePicker;
    if(FilePicker) {
    FilePicker.pickFile( 
        (res) => {
            var filename = res.substring(res.lastIndexOf('/')+1);
            var request = new XMLHttpRequest();
            request.open('GET', res, true);
            request.responseType = 'blob';
            request.onload = function() {
                const blob = request.response;
                const file = { name: filename, type: blob.type, size: blob.size };
                onSelectFile({ blob, file });
            };
            request.send();
        }, (err) => {
            console.log(err);
        });
    }
}
