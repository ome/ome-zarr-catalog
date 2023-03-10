import React from "react";

import openwithJson from "../public/openwith.json";
// use static import of vizarr_logo.png to get base URL for other logos
import vizarr_logo from "/vizarr_logo.png";

export default function OpenWith({ source }) {
  let viewers = openwithJson.viewers;

  return (
    <React.Fragment>
      {viewers.map((viewer) => (
        <a key={viewer.name} target="_blank" href={viewer.href + source} title={"Open with " + viewer.name}>
          <img className="viewer_icon" src={vizarr_logo.replace("/vizarr_logo.png", viewer.logo)} />
        </a>
      ))}
    </React.Fragment>
  );
}
