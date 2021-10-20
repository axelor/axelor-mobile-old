import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Page from './page';

class NoPageFound extends Component {
  render() {
    return (
      <Page
        {...this.props}
        title={
          <div className='center'>
            {this.props.route.name}
          </div>
        }
        >
        <div>
          <h1> Page Not Found </h1>
        </div>
      </Page>
    );
  }
}

NoPageFound.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

export default NoPageFound;
