import * as ACTIONS from '../actions';

const defaultState = {
  isAuth: false,
  data: {},
};

export default (state = defaultState, action) => {
  switch (action.type) {
    case ACTIONS.USER_SETTINGS:
      const { isAuth, data } = action;
      return { ...state, isAuth, data: { ...state.data, ...data }};
    case ACTIONS.USER_LOGOUT:
      return { ...state, isAuth: false, data: { ...state.data, password: '' }};
    default:
      return state;
  }
}
