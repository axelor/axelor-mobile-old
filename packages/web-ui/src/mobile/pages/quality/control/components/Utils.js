export const uploadChunk = async (chunk, headers, uploadFile) => {
  return uploadFile(chunk, headers);
};

export const uploadInChunk = async (file, uploadFile, type = "sign") => {
  const chunkSize = 512 * 1024;
  const fileSize = file.size;
  let offset = 0;
  let end = 0;
  let id = null;
  let doUpload = true;
  const fileName = `${type}_${Date.now()}`;
  // let response = null;
  while (doUpload) {
    end = offset + chunkSize < fileSize ? offset + chunkSize : fileSize;
    const blob = file.slice(offset, end);
    const headers = {
      "X-File-Name": fileName,
      "X-File-Offset": Math.min(offset, fileSize),
      "X-File-Size": file.size,
      "X-File-Type": file.type
    };
    if (id) {
      headers["X-File-Id"] = id;
    }
    const res = await uploadChunk(blob, headers, uploadFile);
    const { result } = res;
    if (result.id) {
      doUpload = false;
      return result;
    } else {
      if (result.fileId) {
        id = result.fileId;
      }
      offset = chunkSize + offset;
    }
  }
};
