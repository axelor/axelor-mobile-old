import React, { Component } from 'react';
import { Icon } from 'react-onsenui';

import { translate } from './../../locale';

class SearchInput extends Component {
  render() {
    const { placeholder, className } = this.props;
    return (
        <div className={`search-container ${className}`} style={{...this.props.style}}>
            <div className="search-icon-container">
                <Icon className="searchbar-icon" icon='md-search'/>
            </div>
            <div className="search-input-container">
                <input
                  className="search-input-box"
                  type="text"
                  placeholder={placeholder || translate('input_search')}
                  onChange={(e) => this.props.onValueChange(e.target.value)}
                />
            </div>
        </div>
    );
  }
}

export default SearchInput;
