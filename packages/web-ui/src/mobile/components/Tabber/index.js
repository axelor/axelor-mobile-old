import React from 'react';
import classNames from 'classnames';
import './styles.css';

export const Tab = ({ className, style, title, active, onClick, activeColor, titleClassName, hideTab, isSingle }) => (
  !hideTab &&
  <div
    style={{...style, borderBottom: (active && isSingle) ?  `3px solid transparent`: active && activeColor && `3px solid ${activeColor}`}}
    className={classNames('tabber-item', active ? 'active-tabber-tab' : 'inactive-tabber-tab', className)}
    onClick={() => onClick && onClick()}>
    <span
      className={classNames('tabber-title', titleClassName)}
    >
      {title}
    </span>
  </div>
);

export const TabberView = ({className, children, containerClassName}) => (
  <div
    className={`tab-container ${containerClassName}`}
  >
    <div className={classNames('tabber-view', className)} >
      {children}
    </div>
  </div>
);

TabberView.Tab = Tab;

export default TabberView;
