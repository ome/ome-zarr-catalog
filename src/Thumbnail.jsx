import React from "react";

import { openArray, slice } from "zarr";
import {getNgffAxes, renderTo8bitArray, getMinMaxValues, getDefaultVisibilities, hexToRGB} from "./util";

export default function Thumbnail({ source, attrs }) {
  // const [r, setChunk] = React.useState();

  const [canvasSize, setCanvasSize] = React.useState({width: 100, height: 100});

  const canvas = React.useRef();


  React.useEffect(() => {
    const fn = async function () {
      let paths = attrs.multiscales[0].datasets.map(d => d.path);
      let axes = getNgffAxes(attrs.multiscales).map(a => a.name);
      console.log("paths", paths, "axes", axes);

      let path = paths.at(-1);
      const store = await openArray({ store: source + "/" + path, mode: "r" });

      let chDim = axes.indexOf('c');

      let shape = store.meta.shape;
      let dims = shape.length;
      let ch = store.meta.chunks;
      console.log("shape", shape, ch);

      let channel_count = shape[chDim];
      let visibilities;
      let colors;
      if (attrs?.omero?.channels) {
        console.log("omero channels", attrs?.omero?.channels)
        visibilities = attrs.omero.channels.map(ch => ch.active);
        colors = attrs.omero.channels.map(ch => hexToRGB(ch.color));
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

      console.log({visibilities, activeChannels, colors});

      let promises = activeChannels.map(chIndex => {
        let indecies = shape.map((dimSize, index) => {
          // channel
          if (index == chDim) return chIndex;
          // x and y
          if (index >= dims - 2) {
            return slice(0, dimSize);
          }
          // z
          if (axes[index] == 'z') {
            return parseInt(dimSize / 2);
          }
          return 0;
        });
        console.log('ch indecies', chIndex, indecies);
        return store.get(indecies);
      });


      let ndChunks = await Promise.all(promises);
      console.log('ndChunks', ndChunks);




      let minMaxValues = ndChunks.map(ch => getMinMaxValues(ch));

      console.log("minMaxValues", minMaxValues);

      let rbgData = renderTo8bitArray(ndChunks, minMaxValues, colors);

      console.log("rbgData", rbgData);
      // setChunk(data);
      let width = shape.at(-1);
      let height = shape.at(-2);
      setCanvasSize({width, height });

      const ctx = canvas.current.getContext('2d');
      ctx.putImageData(new ImageData(rbgData, width, height), 0, 0);
    };

    fn();
  }, []);

  return <div>
    <canvas style={{maxWidth: 100, maxHeight: 100}} ref={canvas} height={canvasSize.height} width={canvasSize.width} />
  </div>;
}
