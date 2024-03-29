import React from "react";

import { openArray, slice } from "zarr";
import {
  getNgffAxes,
  renderTo8bitArray,
  getMinMaxValues,
  getDefaultVisibilities,
  hexToRGB,
  getDefaultColors,
} from "./util";

const MAX_LENGTH = 100;

export default function Thumbnail({ source, attrs }) {
  // const [r, setChunk] = React.useState();

  const [canvasSize, setCanvasSize] = React.useState({
    width: MAX_LENGTH,
    height: MAX_LENGTH,
  });

  const canvas = React.useRef();

  React.useEffect(() => {
    const fn = async function () {
      let paths = attrs.multiscales[0].datasets.map((d) => d.path);
      let axes = getNgffAxes(attrs.multiscales).map((a) => a.name);

      let path = paths.at(-1);
      const store = await openArray({ store: source + "/" + path, mode: "r" });

      let chDim = axes.indexOf("c");

      let shape = store.meta.shape;
      let dims = shape.length;
      let ch = store.meta.chunks;

      let channel_count = shape[chDim];
      let visibilities;
      let colors;
      if (attrs?.omero?.channels) {
        visibilities = attrs.omero.channels.map((ch) => ch.active);
        colors = attrs.omero.channels.map((ch) => hexToRGB(ch.color));
      } else {
        visibilities = getDefaultVisibilities(channel_count);
        colors = getDefaultColors(channel_count, visibilities);
      }
      // filter for active channels
      colors = colors.filter((col, idx) => visibilities[idx]);

      let activeChannels = visibilities.reduce((prev, active, index) => {
        if (active) prev.push(index);
        return prev;
      }, []);

      let promises = activeChannels.map((chIndex) => {
        let indecies = shape.map((dimSize, index) => {
          // channel
          if (index == chDim) return chIndex;
          // x and y
          if (index >= dims - 2) {
            return slice(0, dimSize);
          }
          // z
          if (axes[index] == "z") {
            return parseInt(dimSize / 2);
          }
          return 0;
        });
        return store.get(indecies);
      });

      let ndChunks = await Promise.all(promises);

      let minMaxValues = ndChunks.map((ch) => getMinMaxValues(ch));

      let rbgData = renderTo8bitArray(ndChunks, minMaxValues, colors);

      const width = shape.at(-1);
      const height = shape.at(-2);
      let scale = width / MAX_LENGTH;
      if (height > width) {
        scale = height / MAX_LENGTH;
      }
      const cssWidth = width / scale;
      const cssHeight = height / scale;
      setCanvasSize({ width, height, cssWidth, cssHeight });

      const ctx = canvas.current.getContext("2d");
      ctx.putImageData(new ImageData(rbgData, width, height), 0, 0);
    };

    fn();
  }, []);

  return (
      <canvas
        style={{ width: canvasSize.cssWidth, height: canvasSize.cssHeight, maxWidth: 100, maxHeight: 100, backgroundColor: 'lightgrey' }}
        ref={canvas}
        height={canvasSize.height}
        width={canvasSize.width}
      />
  );
}
