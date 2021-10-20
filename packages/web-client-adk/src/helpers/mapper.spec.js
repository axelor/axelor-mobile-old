import mappers from './mappers';

const dummyModel = {
  model: 'com.axelor.test.dummy',
  fields: ['fullName', 'startDate', 'user', 'createDate'],
  mapFields: {
    fullName: 'full_name',
    startDate: 'start_date',
    createDate: 'create_date',
  },
  mapLabels: {
    fullName: 'Name',
    startDate: 'Entry Date',
    createDate: 'Date of Creation',
  },
}

const dummyUser = {
  model: 'com.axelor.test.user',
  fields: ['fullName', 'id'],
  mapFields: {
    fullName: 'full_name',
  },
  mapLabels: {
    fullName: 'Name of User',
  }
}


describe('Test to Mapping model simple fields', () => {
  const { requestMapper, responseMapper, optionsMapper, fieldsMapper, searchMapper } = mappers(dummyModel, { refs: [{ model: 'User', field: 'user'}]});

  test('Should return original name of fields in request', () => {
    const dummyRequest = {
      full_name: 'Test Data',
      start_date: '23-12-2017',
      create_date: '13-12-2017',
      user: 'axelor',
    };
    const requestData = requestMapper(dummyRequest);
    const fields = dummyModel.fields;
    const resultFields = Object.keys(requestData);
    for (let i = 0; i < fields.length; i++) {
      expect(resultFields.findIndex(f => f === fields[i])).toBeGreaterThan(-1);
    }
  });

  test('should map nested field of an object value', () => {
    const dummyRequest = {
      full_name: 'Test Data',
      start_date: '23-12-2017',
      create_date: '13-12-2017',
      user: {id: 1, full_name: 'Axelor'}
    };
    const requestData = requestMapper(dummyRequest);
    const dummyUserKeys = dummyUser.fields;
    const resultKeys = Object.keys(requestData.user);
    for (let i = 0; i < dummyUserKeys.length; i++) {
      expect(resultKeys.findIndex(k => k === dummyUserKeys[i])).toBeGreaterThan(-1);
    }
  });

  test('Should return response fields in form of mapFields name', () => {
    const fields = Object.keys(dummyModel.mapFields).map(v => dummyModel.mapFields[v]);
    const dummyResponse = {
      fullName: 'Test Data',
      startDate: '23-12-2017',
      createDate: '13-12-2017',
      user: 'axelor',
    };
    const responseResult = responseMapper(dummyResponse);
    const responseFields = Object.keys(responseResult);
    for (let i = 0; i < fields.length; i++) {
      expect(responseFields.findIndex(f => f === fields[i])).toBeGreaterThan(-1);
    }
  });

  describe('map field with label and name', () => {
    const fields = fieldsMapper(dummyModel.fields);
    test('should return label and name of field', () => {
      const labels = Object.keys(dummyModel.mapLabels).map(l => dummyModel.mapLabels[l]);
      const names = Object.keys(dummyModel.mapFields).map(n => dummyModel.mapFields[n]);
      for (let i = 0; i < labels.length; i++) {
        expect(fields.findIndex(f => f.label === labels[i])).toBeGreaterThan(-1);
      }
      for (let i = 0; i < names.length; i++) {
        expect(fields.findIndex(f => f.name === names[i])).toBeGreaterThan(-1);
      }
    });

    test('should return null label for user field', () => {
      const label = fields[fields.findIndex(f => f.name === 'user')].label;
      expect(label).toBeNull();
    });
  });

  describe('test to map options', () => {
    const dummyOptions = {
      fields: ['full_name', 'start_date', 'user'],
      search: {
        fields: ['full_name'],
        value: 'abc'
      },
    };
    const options = optionsMapper(dummyOptions);
    test('should return fields', () => {
      const originalFields = dummyModel.fields;
      const fields = options.fields;
      for (let i = 0; i < fields.length; i++) {
        expect(originalFields.findIndex(f => f === fields[i])).toBeGreaterThan(-1);
      }
    });

    test('should match search criteria', () => {
      const { data } = options;
      const { criteria } = data;
      const dummyCriteria = [{fieldName:'fullName',operator:'like',value:'abc'}];
      expect(criteria).toEqual(dummyCriteria);
    });

    test('should return domain for array of id', () => {
      const ids = [1,2,3,4,5];
      const resultOptions = optionsMapper({ id: ids});
      const { data } = resultOptions;
      expect(data._domain).toContain('self.id in');
      expect(data._domainContext.ids).toEqual(ids);
    });
  });

  describe('testing search mapping', () => {
    dummyModel['selection'] = 'dummy.test.selectio.type';
    const localMapper = mappers(dummyModel, { refs: [{ model: 'User', field: 'user'}]});
    const records = [
      { id: 1, title: 'ABC', value: 'abc', hidden: false},
      { id: 2, title: 'XYZ', value: 'xyz', hidden: false},
      { id: 3, title: 'ABC', value: 'abc', hidden: true},
      { id: 4, title: 'Axelor', value: 'axelor', hidden: false},
    ];

    test('should hide previous same value record', () => {
      const resultSearch = localMapper.searchMapper({ data: records });
      const { data } = resultSearch;
      const target = data.findIndex(d => d.id === 1);
      expect(data.length).toBe(3);
      expect(target).toBe(-1);
    });

    test('should not hide record if not repeated and it has hidden true', () => {
      const dummyRecords = [
        { id: 2, title: 'XYZ', value: 'xyz', hidden: false},
        { id: 3, title: 'ABC', value: 'abc', hidden: true},
        { id: 4, title: 'Axelor', value: 'axelor', hidden: false},
      ];
      const resultSearch = localMapper.searchMapper({ data: dummyRecords });
      const { data } = resultSearch;
      const target = data.findIndex(d => d.id === 3);
      expect(data.length).toBe(3);
      expect(target).toBeGreaterThan(-1);
    });

    test('should return last record which has hidden true from multiple record', () => {
      const dummyRecords = [
        { id: 1, title: 'ABC', value: 'abc', hidden: false},
        { id: 2, title: 'XYZ', value: 'xyz', hidden: false},
        { id: 3, title: 'ABC', value: 'abc', hidden: true},
        { id: 4, title: 'Axelor', value: 'axelor', hidden: false},
        { id: 5, title: 'ABC', value: 'abc', hidden: true},
      ];
      const resultSearch = localMapper.searchMapper({ data: dummyRecords });
      const { data } = resultSearch;
      const target = data.findIndex(d => d.id === 3);
      const actualTarget = data.findIndex(d => d.id === 5);
      expect(data.length).toBe(3);
      expect(target).toBe(-1);
      expect(actualTarget).toBeGreaterThan(-1);
    });
  });
});
