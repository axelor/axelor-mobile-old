//Redux Actions
export const SET_APP_MODE = 'SET_APP_MODE';
export const SET_APP_ERROR = 'SET_APP_ERROR';
export const SET_ROUTE = 'SET_ROUTE';
export const SET_APP_PLATFORM = 'SET_PLATFORM';1
export const USER_SETTINGS = 'USER_SETTINGS';
export const USER_LOGOUT = 'USER_LOGOUT';

// Redux Action Creators
export const setAppMode = (mode) => {
  return { type: SET_APP_MODE, mode };
}

export const setAppError = (error) => {
  return { type: SET_APP_ERROR, error };
}

export const setPlatform = (name) => {
  return { type: SET_APP_PLATFORM, name };
}

export const setRoute = (path) => {
  return { type: SET_ROUTE, path };
}

export const setUserSettings = (isAuth = false, data = {}) => {
  return { type: USER_SETTINGS, isAuth, data };
}

export const userLogout = () => {
  return { type: USER_LOGOUT };
}
