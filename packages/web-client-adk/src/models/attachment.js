const model = 'com.axelor.dms.db.DMSFile';

const fields = ["fileName", "permissions", "updatedOn", "parent.id", "parent", "relatedId", "relatedModel", "isDirectory", "metaFile.id", "metaFile.sizeText", "fileType"];

const mapFields = {
  fileName: 'fileName',
  firstName: 'permissions',
  updatedOn: 'updatedOn',
  "parent.id":"parent.id",
  parent: 'parent',
  relatedModel: 'related_model',
  isDirectory: 'is_directory',
  "metaFile.id":"metaFile.id",
  "metaFile.sizeText":"metaFile.sizeText",
  fileType: 'Partner.file_type'
};

const mapLabels = {
  fileName: 'Attechment.fileName',
  permissions: 'Partner.permissions',
  updatedOn: 'Partner.updatedOn',
  parent: 'Partner.parent',
  relatedId: 'Partner.relatedId',
  relatedModel: 'Partner.relatedModel',
  isDirectory: 'Partner.isDirectory',
  fileType: 'Partner.fileType'
};

const responseMapper = (data, rest) => {
  if (!data.picture) return data;
  return Object.assign({}, data, {
    pictureURL: `${rest.baseURL}ws/rest/com.axelor.meta.db.MetaFile/${data.picture.id}/content/download?image=true&v=${data.version}`
  })
};

export default {
  model,
  fields,
  mapFields,
  mapLabels,
  responseMapper,
};
