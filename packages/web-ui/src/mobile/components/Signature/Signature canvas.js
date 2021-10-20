import React, { Component } from "react";
import SignaturePad from "signature_pad/dist/signature_pad.js";
import "./style.css";

class SignatureCanvas extends Component {
  constructor(props) {
    super(props);
    this.sigCanvas = React.createRef(null);
  }

  componentDidMount() {
    const { onInit } = this.props;
    if (this.sigCanvas.current) {
      this.sigCanvas.current.width = window.innerWidth - 2;
      const signaturePad = new SignaturePad(this.sigCanvas.current);
      onInit && onInit(signaturePad);
    }
  }

  render() {
    return (
      <canvas ref={this.sigCanvas} height="200" className="signature-canvas" />
    );
  }
}

export default SignatureCanvas;
