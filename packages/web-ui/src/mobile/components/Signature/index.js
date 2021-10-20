import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Page, { PageElement } from '../../pages/page';
import { Icon, Toolbar, ToolbarButton } from 'react-onsenui';
import Translate from '../../locale';
import SignaturePad from 'signature_pad/dist/signature_pad.js';
import './style.css';

class SignatureView extends Component {
  constructor(props) {
    super(props)
    this.sigCanvas = React.createRef();
    this.signaturePad = null;
  }

  componentDidMount() {
    if(this.sigCanvas) {
      this.signaturePad = new SignaturePad(this.sigCanvas);
    }
  }

  clearSign() {
    if(this.signaturePad) {
      this.signaturePad.clear();
    }
  }

  saveSign() {
    const { onSign } = this.props.route;
    if(onSign && this.signaturePad) {
      onSign(this.signaturePad.toDataURL());
    }
    this.goBack();
  }

  goBack() {
    const { navigator } = this.props.route;
    if(navigator.popPage) {
      navigator.popPage();
    }
  }

  renderToolbar() {
    return (
      <Toolbar noshadow modifier="transparent" style={{ background: '#fff' }}>
        <div className='left left-icon-width'>
          <ToolbarButton onClick={() => this.goBack()} style={{ color: 'gray' }}>
            <Icon icon='chevron-left' />
          </ToolbarButton>
        </div>
        <div className='center ellipse-toolbar'>
          <Translate text={`app.signature.title`} />
        </div>
        <div className="right icons" style={{ paddingRight: "10px" }}>
          <PageElement key="close">
            <div style={{ color: "rgba(44, 196,211,1)", marginRight: 5 }} className="round-icon" onClick={() => this.saveSign()}>
              <Icon icon='fa-save' style={{ fontSize: 20 }}/>
            </div>
          </PageElement>
          <PageElement key="clear">
            <div style={{ color: "rgba(44, 196,211,1)" }} className="round-icon" onClick={() => this.clearSign()}>
              <Icon icon='fa-eraser' style={{ fontSize: 20 }}/>
            </div>
          </PageElement>
        </div>
      </Toolbar>
    );
  }

  render() {
    return (
      <Page
        {...this.props}
        renderToolbar={() => this.renderToolbar()}
      >
        <div className="page-content hr-form-page">
        <canvas
          ref={e => { this.sigCanvas = e }}
          className="signature-canvas"
        >
        </canvas>
        </div>
      </Page>
    );
  }
}


SignatureView.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

export default SignatureView;
