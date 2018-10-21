import React, { Component } from 'react';

import Colors from '../common/Colors';
import LayoutGrid from 'preact-material-components/LayoutGrid';

import './ColorPalette.css';



class ColorPalette extends Component {

    statics = {
        Colors
    }

    constructor(props) {
        super(props);
        this.selectColor = [];
        for (let i = 0; i < 16; i++) {
            this.selectColor[i] = this.props.selectColor.bind(this, Colors[i]);
        }
        this.state = {};
    }

    render() {

        const colorPalette = [];

        for (let y = 0; y < 8; y++) {
            const cols = [];
            for (let x = 0; x < 2; x++) {
                const index = y * 2 + x;
                let selectedItem = false;
                if (Colors[index] === this.props.selectedColor) {
                    selectedItem = <div className="ColorPalette-selected"></div>
                }
                cols.push(
                    <div key={index} className="ColorPalette-column" >
                        <div onClick={this.selectColor[index]}
                            style={{ backgroundColor: Colors[index] }}
                            className="ColorPalette-content"></div>
                        {selectedItem}
                    </div>);
            }
            const row = <LayoutGrid.Cell desktopCols={6} tabletCols={12} phoneCols={1} key={y}>{cols}</LayoutGrid.Cell>;
            colorPalette.push(row);
        }

        return (
            <LayoutGrid className="ColorPalette-grid">

                <LayoutGrid.Inner className="ColorPalette-row">
                    {colorPalette}

                </LayoutGrid.Inner>
            </LayoutGrid>
        );
    }
}

export default ColorPalette;
