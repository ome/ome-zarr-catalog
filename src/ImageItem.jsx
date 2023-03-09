import React from "react";

import Thumbnail from "./Thumbnail";
import { open, getNgffAxes } from "./util";
import { openArray } from "zarr";

// DeckGL react component
export default function ImageItem({ source, zarr_columns }) {
  if (source.endsWith("/")) {
    source = source.slice(0, -1);
  }

  const [imgInfo, setImageInfo] = React.useState({});

  React.useEffect(() => {
    const fn = async function () {
      let node = await open(source);
      let attrs = await node.attrs.asObject();

      let keywords = [];
      let wells = "";
      let fields = "";

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
      if (imgInfo[col_name] != undefined) {
        return imgInfo[col_name];
      } else {
        return <span style={{"color": "#959595"}}>Loading...</span>
      }
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
