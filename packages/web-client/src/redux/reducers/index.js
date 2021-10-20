import { combineReducers } from 'redux';
import app from './app';
import user from './user';

export default (reducers = {}) => combineReducers({
  app,
  user,
  ...reducers,
});
