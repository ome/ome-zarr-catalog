import React from "react";

import copy_icon from "/copy_icon.png";

export default function CopyButton({ source }) {

  let [shaking, setShaking] = React.useState(false);

  function copyTextToClipboard() {
    var textArea = document.createElement("textarea");
    // Place in the top-left corner of screen regardless of scroll position.
    textArea.style.position = "fixed";

    textArea.value = source;

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    var successful;
    try {
      successful = document.execCommand("copy");
    } catch (err) {
      console.log("Oops, unable to copy");
    }
    document.body.removeChild(textArea);

    if (successful) {
      // show user that copying happened - update text on element (e.g. button)
      setShaking(true);
      setTimeout(() => {
        // reset after 1 second
        setShaking(false);
      }, 1000);
    } else {
      console.log("Copying failed");
    }
  }

  let buttonStyle = {
    background: "transparent",
    border: "none",
    padding: "0 2px"
  };
  if (shaking) {
    // NB: seesaw is defined in global App.css
    buttonStyle["animation"] = "0.1s linear 0s infinite alternate seesaw";
  }
  
  return (
    <button title="Copy" style={buttonStyle} onClick={copyTextToClipboard}>
      <img src={copy_icon} />
    </button>
  );
}
