import React, { Component } from 'react';
import { Router } from 'preact-router';

import Header from './header/Header';
import Home from './home/Home';
import Login from './login/Login';
import Edit from './pixelboard/Edit';
import Imprint from './imprint/Imprint';

export default class App extends Component {


  constructor(props) {
    super(props);

    this.getPixelData();


    this.state = {
      items: []
    }
  }

  getPixelData = () => {

    fetch('/list').then((response) => {
      response.json().then((data) => {
        this.setState({ items: (data.items) });
      })

    }).catch(function (err) {
      // Error :(
    });

  }

	/** Gets fired when the route changes.
	 *	@param {Object} event		"change" event from [preact-router](http://git.io/preact-router)
	 *	@param {string} event.url	The newly routed URL
	 */
  handleRoute = e => {
    this.currentUrl = e.url;
  };

  render() {
    const { items } = this.state;
    return (
      <div id="app">
        <Header />
        <Router onChange={this.handleRoute}>
          <Home path="/" items={items} />
          <Login path="/login/" />
          <Edit path="/pixel/" updatePixelData={this.getPixelData} />
          <Edit path="/pixel/:pixelId" updatePixelData={this.getPixelData} />
          <Imprint path="/impressum/" />
        </Router>
      </div>
    );
  }
}
