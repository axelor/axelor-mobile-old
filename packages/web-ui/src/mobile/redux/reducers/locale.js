import * as ACTIONS from '../actions';

const defaultState = {
  key: 'en',
  meta: {
    en: {},
    fr: {},
  },
};

export default (state = defaultState, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOCALE:
      return { ...state, key: action.key };
    case ACTIONS.SET_LOCALE_STORE:
      {
        const { key, store } = action;
        return { ...state, meta: { ...state.meta, [key]: {...store} } };
      }
    default:
      return state;
  }
}
