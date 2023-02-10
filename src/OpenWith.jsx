import React from "react";

import openwithJson from "../public/openwith.json";

export default function OpenWith({ source }) {
  let viewers = openwithJson.viewers;

  return (
    <React.Fragment>
      {viewers.map((viewer) => (
        <a key={viewer.name} target="_blank" href={viewer.href + source} title={"Open with " + viewer.name}>
          <img className="viewer_icon" src={viewer.logo} />
        </a>
      ))}
    </React.Fragment>
  );
}
