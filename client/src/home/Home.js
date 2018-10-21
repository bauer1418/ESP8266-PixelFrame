import React, { Component } from "react";
import style from "./style.less";
import List from "preact-material-components/List";

export default class Home extends Component {
  render() {
    const listItems = this.props.items.map(itemId => {
      return (
        <List.LinkItem ripple={true} href={"/pixel/" + itemId}>
          <img
            src={"/gif/" + itemId}
            alt=""
            height="40"
            width="40"
            style={{ marginRight: 10 }}
          />
          {itemId}
        </List.LinkItem>
      );
    });
    return (
      <div class={style.home}>
        <List>
          <List.LinkItem ripple={true} href={"/pixel/"}>
            <img
              src={"/gif/556"}
              alt=""
              height="40"
              width="40"
              style={{ marginRight: 10 }}
            />{" "}
            Neues Bild hinzufügen
          </List.LinkItem>
          {listItems}
        </List>
      </div>
    );
  }
}
