const model = 'com.axelor.apps.message.db.Template';

const fields = ["id", "name"];

const search = (options) => {
  return {
    ...options,
    data: {
      ...(options.data || {}),
      _domain: options.data && options.data._domain || `self.metaModel.fullName = '${options.model}' and self.isSystem != true and self.language.id = ${options.language.id}`,
      _domainContext: {
        language: options.language,
      },
    },
  };
};

export default {
  model,
  fields,
  search,
};
