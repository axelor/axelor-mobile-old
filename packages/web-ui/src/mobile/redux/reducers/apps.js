import * as ACTIONS from '../actions';
import bootstrap, { setAppConfigs, setActiveApp, getActiveApp } from '../../apps';

const defaultState = () => ({
  active: getActiveApp(),
  activeMenuIndex: null,
  activeMenuItemIndex: null,
  modal: null,
  backListener: true,
  ...bootstrap(),
});

export default (state = defaultState(), action) => {
  switch (action.type) {
    case ACTIONS.DISABLE_BACK_HANDELER:
      return {...state, backListener: false};
    case ACTIONS.ENABLE_BACK_HANDELER:
      return {...state, backListener: true};
    case ACTIONS.SHOW_MODAL:
      return { ...state, modal: action.modal, activeMenuIndex: action.modal === 'menu' ? action.index : state.action };
    case ACTIONS.HIDE_MODAL:
      return { ...state, modal: null };
    case ACTIONS.RESET_APP:
      {
        const { data, active } = state;
        data[active].active = null;
        return { ...state, data: [...data] };
      }
    case ACTIONS.SELECT_APP:
      setActiveApp(action.index);
      return { ...state, active: action.index, activeMenuIndex: 0, activeMenuItemIndex: 0 };
    case ACTIONS.SELECT_MENU:
      {
        const { data, active } = state;
        data[active].active = action.index
        return { ...state, data: [...data], activeMenuIndex: action.index };
      }
    case ACTIONS.SELECT_MENU_ITEM:
    {
      const { menuIndex, index } = action;
      const { data, active } = state;
      data[active].active = menuIndex;
      data[active].menu[menuIndex] = Object.assign({}, data[active].menu[menuIndex], { active: index });
      return { ...state, data: [...data], activeMenuItemIndex: index };
    }
    case ACTIONS.SET_CONFIG:
      setAppConfigs(action.configs);
      return { ...state, ...action.configs };
    default:
      return state;
  }
}
