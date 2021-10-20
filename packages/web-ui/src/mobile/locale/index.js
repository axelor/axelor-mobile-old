import { connect } from 'react-redux';
import { createStore } from '@axelor/web-client';

export const translate = (tkey) => {
  const store = createStore();
  const { locale } = store.getState();
  const { key, meta } = locale;
  return meta[key] ? meta[key][tkey] : '';
}

const Translate = ({ text, meta }) => {
  return meta[text] || null;
}

const mapStateToProps = (state, props) => {
  return { meta: state.locale.meta[state.locale.key] };
}

export default connect(mapStateToProps)(Translate);
