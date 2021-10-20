import React, { Component } from 'react';
import { Table, Label, Grid, Row, Col, Button, Modal, FormGroup, FormControl, ControlLabel } from 'react-bootstrap';
import { connect } from '@axelor/web-client';
import * as ACTIONS from '@axelor/web-client/redux/actions';
import ManyToOne from './components/many-to-one';

import './App.css';
import 'react-select/dist/react-select.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      record: {},
      loading: false,
      showModal: false,
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.app.mode !== nextProps.app.mode) {
      this.fetchData();
    }
  }

  fetchData() {
    const { search } = this.props.contact;
    this.setState({ loading: true });
    search({
      sortBy: ['first_name'],
      fields: ['first_name', 'last_name', 'full_name', 'company'],
    })
    .then(({ data = [] }) => {
      this.setState({ data: [...data], loading: false })
    });
  }

  show(record = {}) {
    this.setState({ showModal: true, record: {...record} });
  }

  saveOffline(record, index = null) {
    const { data } = this.state;
    const ind = index || data.findIndex(e => e.row_id === record.row_id);
    const { offline: { save }} = this.props.contact;
    return save(record)
    .then((res) => {
      const result = {...record, ...res};
      if (ind === -1) {
        data.push(result);
      } else {
        data[ind] = result;
      }
      this.setState({ data: [...data] });
    });
  }

  syncOffline(record, ind) {
    this.setState({ loading: true });
    const { data } = this.state;
    const { offline: { sync }} = this.props.contact;
    return sync({ ...record, is_offline: 0 })
    .then((result) => {
      data.splice(ind, 1);
      this.setState({ data: [...data], loading: false });
    });
  }

  save() {
    const { record, data } = this.state;
    if (this.props.app.mode === 'offline') {
      return this.saveOffline(record)
      .then(() => this.setState({ loading: false, record: {}, showModal: false }));
    }
    const { add, update } = this.props.contact;
    const api = record.id ? update : add;

    this.setState({ loading: true, showModal: false });

    api(record)
    .then(({ data: [rec]}) => {
      if (record.id || record.id === 0) {
        const ind = data.findIndex(e => e.id === record.id);
        data[ind] = rec;
      } else {
        data.push(rec);
      }
      this.setState({ loading: false, record: {}, data: [...data] });
    });
  }

  delete(record) {
    const { data } = this.state;
    const { remove } = this.props.contact;

    this.setState({ loading: true });

    remove(record)
    .then(({ status }) => {
      if (`${status}` === '0') {
        const ind = data.findIndex(e => e.id === record.id);
        data.splice(ind, 1);
        this.setState({ data: [...data], loading: false });
      }
    });
  }

  isField(field) {
    const { fields } = this.props.contact;
    return fields.find(f => f.name === field);
  }

  renderField(fieldName, control) {
    const { record } = this.state;
    const handleChange = ({ target: { value, name }}) => this.setState({ record: {...this.state.record, [name]: value } });
    const field = this.isField(fieldName);
    if (!field) return null;
    const { label, name } = field;
    return (
      <FormGroup
        controlId={name}
      >
        {
          label &&
          <ControlLabel>{label}</ControlLabel>
        }
        {
          React.cloneElement(control, {
            name,
            value: record[name] || '',
            placeholder: label || '',
            onChange: handleChange,
          })
        }
      </FormGroup>
    );
  }

  renderModal() {
    const close = () => this.setState({ showModal: false });
    const { first_name, company, last_name, id } = this.state.record;
    const handleChange = ({ target: { value, name }}) => this.setState({ record: {...this.state.record, [name]: value } });
    return (
      <Modal show={this.state.showModal} onHide={close}>
        <Modal.Header closeButton>
          <Modal.Title>{id ? 'Edit' : 'New'} Contact</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {
            this.renderField('first_name', <FormControl type="text" />)
          }
          {
            this.renderField('last_name', <FormControl type="text" />)
          }
          {
            this.renderField('company', (
              <ManyToOne
                targetKey="id"
                targetName="name"
                api={() => {
                  return this.props.company.search({
                    fields: ['name', 'id'],
                  });
                }}
              />
            ))
          }
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={close}>Close</Button>
          <Button bsStyle="success" onClick={() => this.save()}>Save Changes</Button>
        </Modal.Footer>
      </Modal>
    )
  }

  render() {
    const { app, dispatch } = this.props;
    const { data, loading } = this.state;
    const isOnline = app.mode === 'online';
    console.log(this.props);
    const isName = (this.isField('first_name') || this.isField('last_name'));
    console.log(this.props);
    return (
      <Grid className="main-container">
        <Row className="show-grid">
          <Col md={12}>
            <div className="pull-right" style={{ marginBottom: 10 }}>
              <select value={app.mode} onChange={({ target: { value }}) => dispatch(ACTIONS.setAppMode(value))} className="form-control">
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </Col>
          <Col md={12} className="text-center loader">
            {
              loading &&
              <h3><Label bsStyle="danger">Loading...</Label></h3>
            }
          </Col>
          <Col md={12}>
            <div className="pull-right" style={{ marginBottom: 10 }}>
              <Button bsStyle="success" onClick={() => this.show()}>Add New</Button>
            </div>
          </Col>
          <Col md={12}>
            <Table striped bordered condensed hover>
              <thead>
                <tr>
                  <th>#</th>
                  {
                     isName &&
                    <th>
                      Name
                    </th>
                  }
                  {
                    this.isField('company') &&
                    <th>Company</th>
                  }
                  {
                    isOnline ?
                    <th>Action</th> :
                    <th>Sync</th>
                  }
                </tr>
              </thead>
              <tbody>
                {
                  data.map((d, i) => (
                    <tr key={i} className={d.is_offline ?(d.id ? 'success' : 'info'): ''}>
                      <td>{i+1}</td>
                      {
                        isName &&
                        <td>
                          {this.isField('first_name') && d.first_name} {' '}
                          {this.isField('last_name') && d.last_name}
                        </td>
                      }
                      {
                        this.isField('company') &&
                        <td>{d.company && d.company.name}</td>
                      }
                      {
                        isOnline ?
                        <td>
                          <Button bsStyle="warning" onClick={() => this.show(d)}>Edit</Button>
                          <Button bsStyle="danger" onClick={() => this.delete(d)}>Remove</Button>
                          <Button bsStyle="default" onClick={() => this.saveOffline(d, i)}>Mark offline</Button>
                        </td> :
                        (
                          <td>
                            {
                              !d.id &&
                              <div>
                                <Button bsStyle="warning" onClick={() => this.show(d)}>Edit</Button>
                                <Button bsStyle="danger" onClick={() => this.delete(d)}>Remove</Button>
                                <Button bsStyle="success" onClick={() => this.syncOffline(d, i)}>Sync</Button>
                              </div>
                            }
                          </td>
                        )
                      }
                    </tr>
                  ))
                }
              </tbody>
            </Table>
          </Col>
        </Row>
        {this.renderModal()}
      </Grid>
    );
  }
}

const mapConnectToProps = (props) => {
  const { refs: { company }, ...contact } = props;
  return { contact, company };
}

const mapConnectConfig = {
  name: 'Contact',
  refs: [
    { model: 'Company', field: 'company' },
  ],
};

export default connect(mapConnectToProps)(App, mapConnectConfig);
