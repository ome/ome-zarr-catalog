import React from "react";

import CopyButton from "./CopyButton";
import OpenWith from "./OpenWith";

export default function ZarrUrl({ source }) {
  let link_style = {
    maxWidth: 150,
    display: "block",
    textOverflow: "ellipsis",
    direction: "rtl",
    whiteSpace: "nowrap",
    overflow: "hidden",
  };

  return (
    <React.Fragment>
      <a title={source} style={link_style} href={source}>
        {source}
      </a>
      <CopyButton source={source} />
      <OpenWith source={source} />
    </React.Fragment>
  );
}
