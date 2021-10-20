import React, { Component } from 'react';
import classNames from 'classnames';
import './styles.css';

class Panel extends Component {
  render() {
    const { children, className, headerClassName, headerTitle, contentClassName } = this.props;
    return (
      <div className={classNames('panel-view', className)}>
        <div className={classNames('panel-header', headerClassName)}>
          {headerTitle}
        </div>
        <div className={classNames('panel-content', contentClassName)}>
          {children}
        </div>
      </div>
    );
  }
}

export default Panel;
