import RestService from './http.rest';
// import MockHTTP from './http';

// jest.mock('@axelor/web-client/http');

// const HTTP = require('@axelor/web-client/http');

// HTTP.mockImplementation(() => new MockHTTP);

global.fetch = jest.fn().mockImplementation((url, options) => Promise.resolve({url: url, options}));

const configs = {
  baseURL: 'test.demo.com/',
};

const mockCallback = jest.fn()
.mockImplementation(() => {
  return {
    init: () => Promise.resolve({ username: 'admin', password: 'admin', url: 'test.demo.com/' }),
    save: () => jest.fn(),
    clear: () => jest.fn(),
  }
});

const dummyRequest = (status = 200) => {
  return Promise.resolve({
    status,
  });
};

const callbackInterceptor = () => {
  return 'callback interceptor';
};

describe("Testing Rest Services", () => {
  const service = new RestService(configs, mockCallback);
  const entityName = 'com.axelor.test.unit';

  test('should set entity', () => {
    service.setEntity(entityName);
    const entity = service.getEntity();
    expect(entity).toEqual(`${configs.baseURL}ws/rest/${entityName}`);
  });

  test('should login from init data', () => {
    service.init().then(() => service.login()).then(e => {
      const { options } = e;
      const { body } = options;
      expect(e.url).toEqual('test.demo.com/login.jsp');
      expect(body).toEqual('{"username":"admin","password":"admin"}');
    });
  });

  test('should make get request by id', () => {
    const id = 1;
    service.get(id).then((e) => {
      const { url } = e;
      expect(url).toEqual(`${configs.baseURL}ws/rest/${entityName}/${id}`);
    })
  });

  test('should make get request by default offset and limit', () => {
    service.getAll().then((e) => {
      const { url } = e;
      expect(url).toContain(`${configs.baseURL}ws/rest/${entityName}`);
      expect(url).toContain('offset=0');
      expect(url).toContain('limit');
    });
  });

  test('should make get request for multiple records by specified offset and limit', () => {
    const offset = 10;
    const limit = 20;
    service.getAll(offset, limit).then((e) => {
      const { url } = e;
      expect(url).toEqual(`${configs.baseURL}ws/rest/${entityName}?offset=${offset}&limit=${limit}`);
    });
  });

  test('should make post request', () => {
    const dummyRecord = {
      name: 'axelor',
      createdDate: '2017-12-25',
      user: { id: 1, full_name: 'admin'},
    }
    service.post(dummyRecord).then((e) => {
      const { url, options} = JSON.parse(JSON.stringify(e));
      expect(options.method).toBe('POST');
      expect(url).toEqual(`${configs.baseURL}ws/rest/${entityName}`);
      const body = JSON.parse((options.body));
      const { data } = body;
      expect(data.name).toBe(dummyRecord.name);
      expect(data.user.id).toBe(dummyRecord.user.id);
    });
  });

  test('should make delete request', () => {
    const id = 1;
    service.delete(id).then((e) => {
      const { url , options} = JSON.parse(JSON.stringify(e));
      expect(options.method).toBe('DELETE');
      expect(url).toContain(id);
    });
  });

  test('should make an action', () => {
    const actionName = 'action.axelor.count.order';
    const record = { id: 1};
    service.action(actionName, record).then((res) => {
      const { url, options} = res;
      expect(url).toContain('ws/action');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body)
      const { data } = body;
      expect(data).toEqual(record);
    });
  });

  test('should request fields', () => {
    const modelName = 'com.axelor.db.sale.order';
    service.fields(modelName).then((res) => {
      const { url, options } = res;
      expect(url).toEqual(`${configs.baseURL}ws/meta/fields/${modelName}`);
      expect(options.method).toBe('GET');
    });
  });

  test('should make request for models', () => {
    service.models().then(res => {
      const { url, options } = res;
      expect(url).toEqual(`${configs.baseURL}ws/meta/models`);
      expect(options.method).toBe('GET');
    });
  });

  test('should make request for view', () => {
    const rawData = {
      viewName: 'com.axelor.sale.order',
    };
    service.view(rawData).then((res) => {
      const { url, options} = res;
      const body = JSON.parse(options.body);

      expect(url).toEqual(`${configs.baseURL}ws/meta/view`);
      expect(body).toEqual(rawData);
      expect(options.method).toBe('POST');
    });
  });

  test('should make info request', () => {
    service.info().then(res => {
      const { url, options } = res;
      expect(url).toEqual(`${configs.baseURL}ws/app/info`);
      expect(options.method).toBe('GET');
    })
  });

  test('should make info request by custom infoURL', () => {
    const infoURL = 'ws/test/info';
    service.info(null, true, infoURL).then(res => {
      const { url, options } = res;
      expect(url).toEqual(`${configs.baseURL}${infoURL}`);
      expect(options.method).toBe('GET');
    })
  });

  test('should make info request by custom baseURL', () => {
    const baseURL = 'apps-test.demo.com/';
    service.info(baseURL).then(res => {
      const { url, options} = res;
      expect(url).toEqual(`${baseURL}ws/app/info`)
      expect(options.method).toBe('GET');
    });
  });

  test('should make request for server', () => {
    service.server().then(res => {
      const { url, options } = res;
      expect(url).toEqual(`${configs.baseURL}server`);
      expect(options.method).toBe('GET');
    });
  });

  test('should make request for server from custom base url', () => {
    const baseURL = 'apps-test.demo.com/';
    service.server(baseURL).then(res => {
      const { url, options } = res;
      expect(url).toEqual(`${baseURL}server`);
      expect(options.method).toBe('GET');
    });
  });

  test('should do authentication by sessionId', () => {
    const sessionId = 'ABAD1D';
    service.auth(null, sessionId).then(res => {
      const { url, options} = res;
      expect(url).toEqual(`${configs.baseURL}auth?sid=${sessionId}`);
      expect(options.method).toBe('GET');
    });
  });

  test('should do authentication by sessionId using custom baseURL', () => {
    const sessionId = 'ABAD1D';
    const baseURL = 'apps-test.demo.com/';
    service.auth(baseURL, sessionId).then(res => {
      const { url, options} = res;
      expect(url).toEqual(`${baseURL}auth?sid=${sessionId}`);
      expect(options.method).toBe('GET');
    });
  });

  test('should make PUT request with no data', () => {
    service.put().then(res => {
      const { url, options} = res;
      expect(url).toEqual(`${configs.baseURL}ws/rest/${entityName}`);
      expect(options.method).toBe('PUT');
      expect(options.body).toBe('{}');
    });
  });

  test('should make PUT with data', () => {
    const record = {
      fullName: 'Axelor',
      createDate: '27-05-2017',
      startDate: '10-12-2017',
    };
    service.put(record).then(res => {
      const { url, options} = res;
      const body = JSON.parse(options.body);
      const { data } = body;
      const resultKeys = Object.keys(data);
      expect(url).toEqual(`${configs.baseURL}ws/rest/${entityName}`);
      expect(options.method).toBe('PUT');
      for(let i = 0; i < resultKeys.length; i++) {
        const key = resultKeys[i];
        expect(data[key]).toBe(record[key]);
      }
    })
  });

  test('should delete multiple records', () => {
    const recordList = [
      { id: 1, version: 1},
      { id: 2, version: 3},
      { id: 3, version: 2},
      { id: 4, version: 4},
      { id: 5, version: 1},
      { id: 6, version: 0},
      { id: 7, version: 1},
    ];
    service.deleteAll(recordList).then((res) => {
      const { url, options} = res;
      const body = JSON.parse(options.body);
      expect(body.records).toEqual(recordList);
      expect(options.method).toBe('POST');
      expect(url).toContain('removeAll');
    });
  });

  test('should delete no record when passing blank list', () => {
    service.deleteAll([]).then(res => {
      const { url, options } = res;
      const body = JSON.parse(options.body);
      expect(options.method).toBe('POST');
      expect(url).toContain('removeAll');
      expect(body.records.length).toEqual(0);
    });
  });

  test('should make download request', () => {
    const id = 1;
    service.downloadFile(id).then((res) => {
      const { url, options } = res;
      expect(options.method).toBe('GET');
      expect(url).toEqual(`${configs.baseURL}ws/dms/download/${id}`);
    });
  });

  test('should make download request without id', () => {
    service.downloadFile().then((res) => {
      const { url, options } = res;
      expect(options.method).toBe('GET');
      expect(url).toEqual(`${configs.baseURL}ws/dms/download/undefined`);
    });
  });

  describe('test diffrent types of search requests', () => {
    let searchObject = {};
    afterEach(() => {
      searchObject = {};
    });

    test('should make search request for specified fields', () => {
      const fields = ['fullName', 'id', 'startDate', 'createdDate'];
      searchObject['fields'] = fields;
      service.search(searchObject).then((res) => {
        const { url, options } = res;
        const body = JSON.parse(options.body);
        expect(url).toEqual(`${configs.baseURL}ws/rest/${entityName}/search`);
        expect(body.fields).toEqual(fields);
        expect(options.method).toBe('POST');
      });
    });

    test('should make search request with no specific fields', () => {
      service.search(searchObject).then((res) => {
        const { url, options } = res;
        const body = JSON.parse(options.body);
        expect(url).toEqual(`${configs.baseURL}ws/rest/${entityName}/search`);
        expect(body.fields).toBeNull();
        expect(options.method).toBe('POST');
      });
    });

    test('should make search request with sortBy fields', () => {
      const sortByFields = ['startDate'];
      searchObject['sortBy'] = sortByFields;
      service.search(searchObject).then((res) => {
        const { url, options } = res;
        const body = JSON.parse(options.body);
        expect(url).toEqual(`${configs.baseURL}ws/rest/${entityName}/search`);
        expect(body.sortBy).toEqual(sortByFields);
        expect(options.method).toBe('POST');
      });
    });

    test('should make search request with default offset & limit', () => {
      service.search(searchObject).then((res) => {
        const { url, options } = res;
        const body = JSON.parse(options.body);
        expect(url).toEqual(`${configs.baseURL}ws/rest/${entityName}/search`);
        expect(body.offset).toBe(0);
        expect(body.limit).toBeGreaterThan(0);
        expect(options.method).toBe('POST');
      });
    });

    test('should make search request with criteria', () => {
      const searchCriteria = [{ fieldName: 'fullName', operator: 'like', value: 'abc'}];
      searchObject['data'] = { criteria: searchCriteria};
      service.search(searchObject).then((res) => {
        const { url, options } = res;
        const body = JSON.parse(options.body);
        expect(url).toEqual(`${configs.baseURL}ws/rest/${entityName}/search`);
        expect(options.method).toBe('POST');
        expect(body.data.criteria).toEqual(searchCriteria);
      });
    });

    test('should make search request with OR operator in data', () => {
      searchObject['data'] = { operator: 'or' };
      service.search(searchObject).then((res) => {
        const { url, options } = res;
        const body = JSON.parse(options.body);
        expect(url).toEqual(`${configs.baseURL}ws/rest/${entityName}/search`);
        expect(options.method).toBe('POST');
        expect(body.data.operator).toBe('or');
      });
    });

    test('_domain should be null', () => {
      service.search(searchObject).then((res) => {
        const { url, options } = res;
        const body = JSON.parse(options.body);
        expect(url).toEqual(`${configs.baseURL}ws/rest/${entityName}/search`);
        expect(options.method).toBe('POST');
        expect(body.data._domain).toBeNull();
      });
    });

    test('should make search with domain', () => {
      const _domain = "self.id = 1";
      searchObject['data'] = { _domain };
      service.search(searchObject).then((res) => {
        const { url, options } = res;
        const body = JSON.parse(options.body);
        expect(url).toEqual(`${configs.baseURL}ws/rest/${entityName}/search`);
        expect(options.method).toBe('POST');
        expect(body.data._domain).toBe(_domain);
      });
    });

    test('should make search with domain and domainContext', () => {
      const _domain = "self.id = :id";
      const _domainContext = { id: 1 };
      searchObject['data'] = { _domain, _domainContext };
      service.search(searchObject).then((res) => {
        const { url, options } = res;
        const body = JSON.parse(options.body);
        expect(url).toEqual(`${configs.baseURL}ws/rest/${entityName}/search`);
        expect(options.method).toBe('POST');
        expect(body.data._domain).toBe(_domain);
        expect(body.data._domainContext).toEqual(_domainContext);
      });
    });

    test('should make search request for archived records', () => {
      searchObject['data'] = { _archived: true };
      service.search(searchObject).then((res) => {
        const { url, options } = res;
        const body = JSON.parse(options.body);
        expect(url).toEqual(`${configs.baseURL}ws/rest/${entityName}/search`);
        expect(options.method).toBe('POST');
        expect(body.data._archived).toBeTruthy();
      });
    });

  });

  describe('should make logout requests', () => {
    test('should make logout request by default baseURL', () => {
      service.logout().then((res) => {
        const { url, options } = res;
        expect(url).toBe(`${configs.baseURL}logout`);
        expect(options.method).toBe('POST');
      });
    });

    test('should make logout request by default baseURL', () => {
      const customURL = 'apps-test.demo.com/';
      service.logout(customURL).then((res) => {
        const { url, options } = res;
        expect(url).toBe(`${customURL}logout`);
        expect(options.method).toBe('POST');
      });
    });
  });

  describe('Testing intercept method', () => {
    test('should intercept 404 request', () => {
      service.intercept(() => dummyRequest(404)).then((res) => {
      })
      .catch(err => {
        expect(err.message).toBe('No Internet');
      });
    });

    test('should intercept 500 request', () => {
      service.intercept(() => dummyRequest(500))
      .catch(err => {
        expect(err.message).toBe('No Internet');
      });
    });

    test('should intercept 401 request', () => {
      service.intercept(() => dummyRequest(401)).then(res => {
        expect(res.status).toBe(401);
      });
    })

    test('should intercept 401 request with interceptor callback', () => {
      const restService = new RestService(configs, mockCallback, () => callbackInterceptor());
      restService.intercept(() => dummyRequest(401))
      .catch(e => {
        expect(e.message).toContain('Unauthorized');
      });
    });

  });

});
