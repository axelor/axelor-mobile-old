import moment from 'moment';

export const ADD_APP = 'ADD_APP';

export const SHOW_MODAL = 'SHOW_MODAL';
export const HIDE_MODAL = 'HIDE_MODAL';
export const SELECT_APP = 'SELECT_APP';
export const RESET_APP = 'RESET_APP';
export const SELECT_MENU = 'SELECT_MENU';
export const SELECT_MENU_ITEM = 'SELECT_MENU_ITEM';
export const SET_CONFIG = 'SET_CONFIG';
export const SET_LOCALE = 'SET_LOCALE';
export const SET_LOCALE_STORE = 'SET_LOCALE_STORE';
export const START_TIMER = 'START_TIMER';
export const STOP_TIMER = 'STOP_TIMER';
export const PAUSE_TIMER = 'PAUSE_TIMER';
export const RESUME_TIMER = 'RESUME_TIMER';
export const SET_TIMER = 'SET_TIMER';
export const SEARCH_FIELDS = 'SEARCH_FIELDS';
export const DISABLE_BACK_HANDELER = 'DISABLE_BACK_HANDELER';
export const ENABLE_BACK_HANDELER = 'ENABLE_BACK_HANDELER';

export const setLocale = (key) => {
  return { type: SET_LOCALE, key };
}

export const setLocaleStore = (key, store) => {
  return { type: SET_LOCALE_STORE, key, store };
}

export const showModal = (modal, index) => {
  return { type: SHOW_MODAL, modal, index };
}

export const hideModal = () => {
  return { type: HIDE_MODAL };
}

export const resetApp = () => {
  return { type: RESET_APP };
}

export const selectAppByIndex = (index) => {
  return { type: SELECT_APP, index };
}

export const disableBackButton = () => {
  return { type: DISABLE_BACK_HANDELER };
}

export const enableBackButton = () => {
  return { type: ENABLE_BACK_HANDELER };
}

export const selectApp = (configKey, navigator) => {
  return (dispatch, getState) => {
    const { data } = getState().apps;
    const taregtIndex = data.findIndex(d => d.userConfigKey === configKey);
    const app = data[taregtIndex];
    const { initialRoute } = app;
    let startMenuIndex = 0;
    let startMenuItemIndex = 0;
    if (initialRoute) {
      app.menu.forEach((m, i) => {
        if (m.items) {
          const ind = m.items.findIndex(x => x.name === initialRoute);
          if (ind > -1) {
            startMenuIndex = i;
            startMenuItemIndex = ind;
          }
        } else if (m.name === initialRoute) {
          startMenuIndex = i;
        }
      });
    }
    const activeMenu = app.menu[startMenuIndex];
    const { name } = activeMenu.items ? activeMenu.items[startMenuItemIndex] : activeMenu;
    navigator.resetPageStack([{ name, key: Date.now() }], { animation: 'none' });
    dispatch(hideModal());
    dispatch(selectAppByIndex(taregtIndex));
    dispatch({ type: SELECT_MENU_ITEM, menuIndex: startMenuIndex, index: startMenuItemIndex });
  }
}

export const selectMenu = (index, navigator, selectLastActive = false) => {
  return (dispatch, getState) => {
    const { data, active, configs } = getState().apps;
    const config = configs[active];
    if(!data[active]) {
      return;
    }
    let menu = data[active].menu[index];
    if (menu.items) {
      const mitems = menu.items.filter(i => config.indexOf(i.name) > -1);
      if (mitems.length === 1) {
        menu = mitems[0];
      }
    }

    if (selectLastActive && menu.items) {
      menu = menu.items[menu.active || 0];
    }

    if (!menu) return;

    if (menu.items) {
      dispatch(showModal('menu', index));
    } else {
      navigator.resetPageStack([{ name: menu.name, key: Date.now(), activeRoute: getState().app.route }], { animation: 'none' });
      dispatch({ type: SELECT_MENU, index });
    }
  };
}

export const selectMenuItem = (menuIndex, index, navigator) => {
  return (dispatch, getState) => {
    const { active, data } = getState().apps;
    const app = data[active];
    const activeMenu = app.menu[menuIndex];
    const { name } = activeMenu.items[index];
    dispatch(hideModal());
    dispatch({ type: SELECT_MENU_ITEM, menuIndex, index });
    navigator.resetPageStack([{ name, key: Date.now(), activeRoute: getState().app.route }], { animation: 'none' });
  }
}

export const setConfig = (config) => {
  return (dispatch, getState) => {
    const { configs, active } = getState().apps;
    configs[active] = config;
    dispatch({ type: SET_CONFIG, configs: [...configs] });
  }
}

export const toggleConfig = (page) => {
  return (dispatch, getState) => {
    const { configs, active } = getState().apps;
    const ind = configs[active].indexOf(page);
    if (ind === -1) {
      configs[active].push(page);
    } else {
      configs[active].splice(ind, 1);
    }
    dispatch({ type: SET_CONFIG, configs: [...configs] });
  }
};

const paddZero = (val) => {
  return Number(val) >= 10 ? val : `0${val}`;
}

const formateTimer = (val) => {
  const secs = val%60;
  const mins = Math.floor(val/60) % 60;
  const hrs = Math.floor(val/3600);
  return `${paddZero(hrs)}:${paddZero(mins)}:${paddZero(secs)}`;
}


let timerInterval = null;

export const setTimer = (interval) => ({
  type: SET_TIMER, interval, interval_str: formateTimer(Number(interval)),
});

export const runTimer = (dispatch, getState) => {
  document.addEventListener('pause', function() {
    const { interval } = getState().timer;
    const timerStamp = {
      interval,
      timeStamp: moment().valueOf(),
    };
    localStorage.setItem("timerStamp", JSON.stringify(timerStamp));
  }, false);

  document.addEventListener('resume', function() {
    const currentTimeStamp = moment();
    const timerStamp = JSON.parse(localStorage.getItem("timerStamp")) || {};
    if(timerStamp.timeStamp) {
      const diff = currentTimeStamp.diff(moment(timerStamp.timeStamp), 'seconds');
      const newInterval = timerStamp.interval ? Number(timerStamp.interval) + diff : diff;
      dispatch(setTimer(newInterval));
    }
  }, false);

  timerInterval = setInterval(() => {
      const { interval } = getState().timer;
      dispatch(setTimer(interval+1));
  }, 1000);
};

export const startTimer = () => {
  return (dispatch, getState) => {
    dispatch({ type: 'START_TIMER' });
    runTimer(dispatch, getState);
  };
}

export const resumeTimer = () => {
  return (dispatch, getState) => {
    dispatch({ type: 'RESUME_TIMER' });
    runTimer(dispatch, getState);
  };
}

export const pauseTimer = () => {
  clearInterval(timerInterval);
  return { type: 'PAUSE_TIMER' };
}

export const stopTimer = () => {
  clearInterval(timerInterval);
  return { type: 'STOP_TIMER' };
}

export const searchData = (app, fields) => {
  return { type: SEARCH_FIELDS, app, fields };
};
