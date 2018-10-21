import React, {Component} from "react";

import LayoutGrid from "preact-material-components/LayoutGrid";
import Button from "preact-material-components/Button";

import PixelBoard from "./PixelBoard";
import ColorPalette from "./ColorPalette";
import {route} from "preact-router";

import LoginService from "../services/LoginService";

import "./Edit.css";

import {formatStringToPixel, formatPixelToString} from "../common/Format";

class App extends Component {
  constructor(props) {
    super(props);

    if (props.pixelId) {
      fetch("/pixelData/" + props.pixelId, {
        credentials: "include"
      })
        .then(response => {
          response.json().then(data => {
            const pixelList = [];
            data.pixels.forEach(pixel => {
              pixelList.push(formatStringToPixel(pixel));
            });
            this.setState({pixelList: pixelList});
          });
        })
        .catch(function(err) {
          // Error :(
        });
    }

    this.state = {
      selectedColor: null,
      pixelList: [[]],
      selectedIndex: 0,
      animationIndex: undefined
    };
  }

  save = () => {
    const pixelData = [];

    this.state.pixelList.forEach(pixelColors => {
      pixelData.push(formatPixelToString(pixelColors).join(""));
    });

    fetch("/pixelData", {
      method: "post",
      credentials: "include",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "Blaa",
        id: this.props.pixelId,
        pixels: pixelData
      })
    }).then(response => {
      response.json().then(data => {
        this.props.updatePixelData();
        if (!this.props.pixelId) {
          route("/pixel/" + data.id);
        }
      });
    });
  };

  close = () => {
    this.props.updatePixelData();
    route("/");
  };

  delete = () => {
    fetch("/delete/" + this.props.pixelId, {
      credentials: "include"
    }).then(response => {
      response.json().then(data => {
        this.props.updatePixelData();
        route("/");
      });
    });
  };

  selectColor = color => {
    console.log(color);
    this.setState({
      selectedColor: color !== this.state.selectedColor ? color : null
    });
  };

  updatePixelColors = pixelColors => {
    const pixelList = [...this.state.pixelList];
    pixelList[this.state.selectedIndex] = pixelColors;
    this.setState({pixelList: pixelList});
  };

  addFrame = () => {
    this.setState({
      pixelList: [...this.state.pixelList, []],
      selectedIndex: this.state.pixelList.length
    });
  };

  selectFrame = (index, evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    this.setState({selectedIndex: index});
  };

  updateAnimation = () => {
    const {pixelList, animationIndex} = this.state;
    const play = pixelList.length - 1 > animationIndex;
    this.setState({animationIndex: play ? animationIndex + 1 : undefined});
    if (play) {
      setTimeout(() => {
        this.updateAnimation();
      }, 500);
    }
  };

  startAnimation = () => {
    this.setState({animationIndex: 0});
    setTimeout(() => {
      this.updateAnimation();
    }, 500);
  };

  render() {
    const {selectedIndex, pixelList} = this.state;
    return (
      <div className="">
        <LayoutGrid>
          <LayoutGrid.Inner>
            <LayoutGrid.Cell desktopCols={8} tabletCols={6} phoneCols={12}>
              <PixelBoard
                grid={true}
                updatePixelColors={this.updatePixelColors}
                pixelColors={pixelList[selectedIndex]}
                selectedColor={this.state.selectedColor}
              />
            </LayoutGrid.Cell>
            <LayoutGrid.Cell desktopCols={4} tabletCols={2} phoneCols={4}>
              <ColorPalette
                selectColor={this.selectColor}
                selectedColor={this.state.selectedColor}
              />
            </LayoutGrid.Cell>
          </LayoutGrid.Inner>
        </LayoutGrid>

        <LayoutGrid>
          <LayoutGrid.Inner>
            {this.state.pixelList.map((pixelColors, index) => {
              return (
                <LayoutGrid.Cell cols={1} tabletCols={1} phoneCols={1}>
                  <div
                    style={{
                      maxWidth: 100,
                      border: "1px solid rgb(204, 204, 204)"
                    }}
                    onClick={this.selectFrame.bind(this, index)}
                  >
                    <PixelBoard
                      view={true}
                      updatePixelColors={this.updatePixelColors}
                      grid={false}
                      pixelColors={pixelColors}
                      selectedColor={this.state.selectedColor}
                    />
                  </div>
                </LayoutGrid.Cell>
              );
            })}
            <LayoutGrid.Cell cols={1} tabletCols={1} phoneCols={1}>
              <div
                style={{maxWidth: 100, border: "1px solid rgb(204, 204, 204)"}}
                onClick={this.startAnimation}
              >
                {this.state.animationIndex === undefined ? (
                  <div className="playBtn" />
                ) : (
                  <PixelBoard
                    view={true}
                    updatePixelColors={this.updatePixelColors}
                    grid={false}
                    pixelColors={
                      this.state.pixelList[this.state.animationIndex]
                    }
                    selectedColor={this.state.selectedColor}
                  />
                )}
              </div>
            </LayoutGrid.Cell>
            <Button
              ripple={true}
              primary={true}
              onClick={this.addFrame}
              raised={true}
            >
              add
            </Button>
          </LayoutGrid.Inner>
        </LayoutGrid>
        <div className="buttonGroup">
          <Button
            ripple={true}
            primary={true}
            onClick={this.save}
            raised={true}
          >
            Save
          </Button>
          {LoginService.isLoggedIn() ? (
            <Button
              ripple={true}
              secondary={true}
              onClick={this.delete}
              raised={true}
            >
              Delete
            </Button>
          ) : (
            false
          )}
          <Button
            ripple={true}
            primary={true}
            onClick={this.close}
            raised={true}
          >
            Close
          </Button>
        </div>
      </div>
    );
  }
}

export default App;
