import React from "react";

import Thumbnail from "./Thumbnail";
// import Viewer from "./Viewer";
import { loadOmeroMultiscales, open, getNgffAxes } from "./util";
import { openArray } from "zarr";

// DeckGL react component
export default function ImageItem({ source, zarr_columns }) {
  if (source.endsWith("/")) {
    source = source.slice(0, -1);
  }

  // const [layers, setLayers] = React.useState([]);

  const [imgInfo, setImageInfo] = React.useState({});

  React.useEffect(() => {
    const fn = async function () {
      let node = await open(source);
      let attrs = await node.attrs.asObject();

      let keywords = [];
      let wells;
      let fields;

      // Check if we have a plate or bioformats2raw.layout...
      let redirectSource;
      if (attrs.plate) {
        fields = attrs.plate.field_count;
        wells = attrs.plate.wells.length;
        let wellPath = source + "/" + attrs.plate.wells[0].path;
        let wellJson = await fetch(wellPath + "/.zattrs").then((rsp) =>
          rsp.json()
        );
        redirectSource = wellPath + "/" + wellJson.well.images[0].path;
        keywords.push("plate");
      } else if (attrs["bioformats2raw.layout"]) {
        // Use the first image at /0
        redirectSource = source + "/0";
      }
      if (redirectSource) {
        // reload with new source
        source = redirectSource;
        node = await open(source);
        attrs = await node.attrs.asObject();
        keywords.push("bioformats2raw.layout");
      }

      // If we are showing Keywords, check for labels under image...
      if (zarr_columns.includes("Keywords")) {
        try {
          let labelsJson = await fetch(source + "/labels/.zattrs").then((rsp) =>
            rsp.json()
          );
          keywords.push(`labels (${labelsJson.labels.join(", ")})`);
        } catch (err) {}
      }

      const axes = getNgffAxes(attrs.multiscales);

      // load first dataset (highest resolution image) to get shape, chunks
      let path = attrs.multiscales[0].datasets[0].path;
      const store = await openArray({ store: source + "/" + path, mode: "r" });
      let shape = store.meta.shape;
      let chunks = store.meta.chunks;

      // let layerData = await loadOmeroMultiscales(config, node, attrs);
      // let shape = ["TBD"]  // layerData.loader[0]._data.meta.shape;
      // let chunks = ["TBD"] // layerData.loader[0]._data.meta.chunks;
      // console.log("layerData.loader[0]._data.meta", layerData.loader[0]._data.meta, chunks, chunks.join(","))

      // let selections = [];
      // layerData.channelsVisible.forEach((visible, chIndex) => {
      //   if (visible) {
      //     selections.push(
      //       axes.map((axis, dim) => {
      //         if (axis.type == "time") return 0;
      //         if (axis.name == "z") return parseInt(shape[dim] / 2);
      //         if (axis.name == "c") return chIndex;
      //         return 0;
      //       })
      //     );
      //   }
      // });

      // layerData.selections = selections;

      // setLayers([layerData]);

      setImageInfo({
        attrs,
        Axes: axes.map((axis) => axis.name).join(""),
        Version: attrs.multiscales?.[0]?.version,
        Keywords: keywords.join(", "),
        Wells: wells,
        shape: "(" + shape.join(", ") + ")",
        chunks: "(" + chunks.join(", ") + ")",
        Fields: fields,
        // use this source for <Thumbnail> to handle plate -> Image update
        source,
      });
    };

    fn();
  }, []);

  let wrapperStyle = {
    width: 150,
    height: 100,
    position: "relative",
  };

  function renderColumn(col_name) {
    if (col_name == "Thumbnail") {
      return (
        <div style={wrapperStyle}>
          {imgInfo.attrs && (
            <Thumbnail
              source={imgInfo.source}
              axes={imgInfo.axes}
              attrs={imgInfo.attrs}
            />
          )}
        </div>
      );
    } else {
      return imgInfo[col_name];
    }
  }

  return (
    <React.Fragment>
      {zarr_columns.map((col_name) => (
        <td key={"zarr-" + col_name}>{renderColumn(col_name)}</td>
      ))}
    </React.Fragment>
  );
}
