import * as ACTIONS from '../actions';

const modeKey = 'web.connect.app.mode';

export const defaultState = {
  mode: localStorage.getItem(modeKey) || 'online',
  platform: 'cordova',
  route: 'home',
  error: null,
};

export default (state = defaultState, action) => {
  switch (action.type) {
    case ACTIONS.SET_APP_ERROR:
      return { ...state, error: action.error };
    case ACTIONS.SET_APP_MODE:
      localStorage.setItem(modeKey, action.mode);
      return { ...state, mode: action.mode };
    case ACTIONS.SET_APP_PLATFORM:
      return {...state, platform: action.name };
    case ACTIONS.SET_ROUTE:
      return {...state, route: action.path };
  }
  return state;
}
