import React, { Component } from "react";
import { route } from "preact-router";
import Toolbar from "preact-material-components/Toolbar";
import Drawer from "preact-material-components/Drawer";
import "./style.css";

export default class Header extends Component {
  closeDrawer() {
    this.drawer.MDComponent.open = false;
  }
  render() {
    return (
      <header class="header">
        <Toolbar className="toolbar">
          <Toolbar.Row>
            <Toolbar.Section align-start={true}>
              <Toolbar.Icon
                onClick={() => {
                  this.drawer.MDComponent.open = true;
                }}
              >
                menu
              </Toolbar.Icon>
              <Toolbar.Title>Pixel Builder</Toolbar.Title>
            </Toolbar.Section>
          </Toolbar.Row>
        </Toolbar>
        <Drawer.TemporaryDrawer
          ref={drawer => {
            this.drawer = drawer;
          }}
        >
          <Drawer.DrawerHeader className="mdc-theme--primary-bg">
            Pixel Builder
          </Drawer.DrawerHeader>
          <Drawer.DrawerContent>
            <Drawer.DrawerItem
              onClick={() => {
                this.closeDrawer();
                route("/");
              }}
            >
              <span href="/impressum/">Home</span>
            </Drawer.DrawerItem>
            <Drawer.DrawerItem
              onClick={() => {
                this.closeDrawer();
                route("/login/");
              }}
            >
              <span>Login</span>
            </Drawer.DrawerItem>
            <Drawer.DrawerItem
              onClick={() => {
                this.closeDrawer();
                route("/impressum/");
              }}
            >
              <span>Impressum</span>
            </Drawer.DrawerItem>
          </Drawer.DrawerContent>
        </Drawer.TemporaryDrawer>
      </header>
    );
  }
}
