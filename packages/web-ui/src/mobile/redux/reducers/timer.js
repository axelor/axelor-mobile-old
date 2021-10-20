import * as ACTIONS from '../actions';

const defaultState = {
  interval: 0,
  interval_str: '00:00:00',
  status: false,
};

export default (state = defaultState, action) => {
  switch (action.type) {
    case ACTIONS.SET_TIMER:
      return { ...state, status: true, interval: action.interval, interval_str: action.interval_str };
    case ACTIONS.START_TIMER:
      return { ...state, status: true };
    case ACTIONS.STOP_TIMER:
      return { ...state, status: false, interval: 0, interval_str: '00:00:00' };
    case ACTIONS.RESUME_TIMER:
      return { ...state, status: true };
    case ACTIONS.PAUSE_TIMER:
      return { ...state, status: false };
    default:
      return state;
  }
}
