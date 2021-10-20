import { connect } from '@axelor/web-client';

const mapConnectToProps = (props) => {
  const {...catalog} = props;
  const api = catalog;
  return { catalog, api };
}

export const model = {
  name: 'Catalog',
  refs: [{
    model: 'CatalogType', field: 'catalogType'
  },
  {
    model: "MetaFile",
    field: "metafile"
  }],
};

export default (CatalogComponent) => connect(mapConnectToProps)(CatalogComponent, model);
