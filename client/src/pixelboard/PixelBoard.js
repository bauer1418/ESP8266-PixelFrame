import React, {Component} from "react";
import "./style.css";

import {NumPixels} from "../common/Format";

export default class PixelBoard extends Component {
  constructor(props) {
    super(props);

    this.selectPixel = [];
    this.lastTouchTarget = null;

    for (let y = 0; y < NumPixels; y++) {
      for (let x = 0; x < NumPixels; x++) {
        const index = y * NumPixels + x;
        this.selectPixel.push(this.selectPixelIndex.bind(this, index));
      }
    }

    this.state = {
      pixelColors: []
    };
  }

  touchMove = evt => {
    const currentTarget = document.elementFromPoint(
      evt.touches[0].clientX,
      evt.touches[0].clientY
    );
    evt.preventDefault();
    if (
      currentTarget &&
      evt.type === "touchmove" &&
      this.lastTouchTarget !== currentTarget &&
      !!currentTarget.id
    ) {
      this.lastTouchTarget = currentTarget;
      this.selectPixelIndex(currentTarget.id);
    }
  };

  selectPixelIndex = (index, evt) => {
    if (this.props.view) {
      return;
    }
    if (
      !evt ||
      evt.type !== "mouseenter" ||
      (evt.type === "mouseenter" && evt.buttons > 0)
    ) {
      //this.props.selectPixelIndex(index);
      const pixelColors = {...this.props.pixelColors};
      pixelColors[index] = this.props.selectedColor;
      this.props.updatePixelColors(pixelColors);
      //this.setState({ pixelColors: pixelColors });
    }
  };

  // Note: `user` comes from the URL, courtesy of our router
  render({user}, {time, count}) {
    const pixelBoard = [];

    for (let y = 0; y < NumPixels; y++) {
      const cols = [];
      for (let x = 0; x < NumPixels; x++) {
        const index = y * NumPixels + x;
        let style = {};
        if (this.props.pixelColors[index]) {
          style.backgroundColor = this.props.pixelColors[index];
        }
        if (this.props.grid) {
          style.border = "1px solid rgb(204, 204, 204)";
        }
        cols.push(
          <div key={y * NumPixels + x} className="PixelBoard-column">
            <div
              style={style}
              id={index}
              onClick={this.selectPixel[index]}
              onMouseEnter={this.selectPixel[index]}
              onMouseDown={this.selectPixel[index]}
              className="PixelBoard-content"
            />
          </div>
        );
      }
      const row = (
        <div key={y} className="PixelBoard-row">
          {cols}
        </div>
      );
      pixelBoard.push(row);
    }

    return <div onTouchMove={this.touchMove}>{pixelBoard}</div>;
  }
}
