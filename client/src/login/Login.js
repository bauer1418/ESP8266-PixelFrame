import React, { Component } from "react";
import "./style.css";
import Textfield from "preact-material-components/TextField";
import Button from "preact-material-components/Button";
import LoginService from "../services/LoginService";
import { route } from "preact-router";

export default class Login extends Component {
  constructor(props) {
    super(props);

    this.formRef = node => {
      console.log("bind", node);
      this.formNode = node;
    };
  }

  onLogin = evt => {
    evt.preventDefault();
    //var form = new FormData();
    //console.log(this.state.username);
    //form.append("username", this.state.username);
    //form.append("password", this.state.password);
    const form = JSON.stringify({
      username: this.state.username,
      password: this.state.password
    });

    fetch("/login", {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: form
    })
      .then(response => {
        response.json().then(data => {
          if (data.error) {
            this.setState({ error: data.error });
          } else {
            LoginService.setLoggedIn(true);
            route("/");
          }
        });
      })
      .catch(function(err) {
        // Error :(
      });
  };

  render() {
    const { error } = this.state;

    if (LoginService.isLoggedIn()) {
      return (
        <div className="login">
          <Button ripple raised href="/logout">
            Logout
          </Button>
        </div>
      );
    } else {
      return (
        <form action="/login" method="post" className="login">
          <div>
            <Textfield
              type="text"
              name="username"
              label="Username"
              value={this.state.username}
              onInput={e => this.setState({ username: e.target.value })}
            />
          </div>
          <div>
            <Textfield
              type="password"
              name="password"
              label="Password"
              value={this.state.password}
              onInput={e => this.setState({ password: e.target.value })}
            />
          </div>
          {error ? <div className="loginError">{error}</div> : false}
          <Button ripple raised type="submit" onClick={this.onLogin}>
            Anmelden
          </Button>
        </form>
      );
    }
  }
}
