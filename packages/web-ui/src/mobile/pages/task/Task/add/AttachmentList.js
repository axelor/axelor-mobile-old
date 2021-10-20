import React from 'react';
import { Icon } from 'react-onsenui';

const AttachmentList = ({
  files,
  maxFiles,
  removeAttachment,
  showImage,
  platform,
}) => {
  let defaultIcon = "";
  let fileItems = [];
  if (platform !== "Android") {
    fileItems = files;
  } else {
    fileItems = Array.prototype.slice.call(files).slice(0, maxFiles);
  }

  const getFileName = item => {
    return item.fileName || item.name || item.file.name;
  };

  return (
    <div className="attachment-list-container">
      {fileItems.map((item, index) => {
        switch (item.file && item.file.type) {
          case "image/png":
          case "image/jpeg":
            defaultIcon = "fa-image";
            break;
          case "application/pdf":
            defaultIcon = "file-pdf-o";
            break;
          default:
            defaultIcon = "fa-file";
        }
        return (
          <div className="attachment-list-item task-attachment" key={index}>
            <div className="attachment-item-col" onClick={()=>showImage(item)}>
              <span style={{ backgroundColor: "#E8EDF0", padding: 5 }}>
                <Icon icon={defaultIcon} />
              </span>
              <span className="attachment-name">{getFileName(item)}</span>
            </div>
            <div className="attachment-item-col">

                <span
                  style={{ padding: "0 10px" }}
                  onClick={() => removeAttachment(item)}
                >
                  <Icon icon="fa-times" />
                </span>

            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AttachmentList;
