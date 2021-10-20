import * as ACTIONS from '../actions';

const defaultState = {
  timesheet: {},
  expense: {},
  km_expense: {},
  leave: {},
};

export default (state = defaultState, action) => {
  switch (action.type) {
    case ACTIONS.SEARCH_FIELDS:
      {
        const { app, fields } = action;
        return { ...state, [app]: {...fields} };
      }
    default:
      return state;
  }
}
