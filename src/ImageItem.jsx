import React from "react";

import Thumbnail from "./Thumbnail";
import Viewer from "./Viewer";
import OpenWith from "./OpenWith";
import CopyButton from "./CopyButton";
import { loadOmeroMultiscales, open, getNgffAxes } from "./util";
import { openArray } from "zarr";

// DeckGL react component
export default function ImageItem({ source, zarr_columns }) {
  let config = { source };

  // const [layers, setLayers] = React.useState([]);

  const [imgInfo, setImageInfo] = React.useState({});

  React.useEffect(() => {
    const fn = async function () {
      let node = await open(config.source);
      let attrs = await node.attrs.asObject();
      console.log("attrs", attrs);

      let keywords = [];
      let wells;
      let fields;

      // Check if we have a plate or bioformats2raw.layout...
      let redirectSource;
      if (attrs.plate) {
        fields = attrs.plate.field_count;
        wells = attrs.plate.wells.length;
        let wellPath = source + "/" + attrs.plate.wells[0].path;
        let wellJson = await fetch(wellPath + "/.zattrs").then(rsp => rsp.json());
        redirectSource = wellPath + "/" + wellJson.well.images[0].path;
      } else if (attrs['bioformats2raw.layout']) {
        // Use the first image at /0
        redirectSource = source + "/0";
      }
      if (redirectSource) {
        // reload with new source
        config = {source: redirectSource}
        node = await open(config.source);
        attrs = await node.attrs.asObject();
        keywords.push("bioformats2raw.layout");
      }

      const axes = getNgffAxes(attrs.multiscales);

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

      // ["URL", "Version", "Axes", "shape, chunks", "Wells", "Fields", "Keywords", "Thumbnail"];
      setImageInfo({
        attrs,
        "Axes": axes.map((axis) => axis.name).join(""),
        "Version": attrs.multiscales?.[0]?.version,
        "Keywords": keywords,
        "Wells": wells,
        "shape": shape.join(", "),
        "chunks": chunks.join(", "),
        "Fields": fields
      });
    };

    fn();
  }, []);

  let wrapperStyle = {
    width: 150,
    height: 100,
    position: "relative",
  };

  let link_style = {
    maxWidth: 150,
    display: "block",
    textOverflow: "ellipsis",
    direction: "rtl",
    whiteSpace: "nowrap",
    overflow: "hidden"
  }

  // ["URL", "Version", "Axes", "shape, chunks", "Wells", "Fields", "Keywords", "Thumbnail"];
  
  function renderColumn(col_name) {
    if (col_name == "URL") {
      return (<React.Fragment>
        <a title={source} style={link_style} href={source}>{source}</a>
        <CopyButton source={source} />
        <OpenWith source={source} />
        </React.Fragment>
      )
    } else if (col_name == "Thumbnail") {
      return (
      <div style={wrapperStyle}>
      {imgInfo.attrs &&
        <Thumbnail source={source} axes={imgInfo.axes} attrs={imgInfo.attrs} />
      }
      </div>)
    } else if (col_name == "shape, chunks") {
      return <React.Fragment>({imgInfo.shape})<br />({imgInfo.chunks})</React.Fragment>
    } else { 
      return imgInfo[col_name];
    }
  }

  return (
    <React.Fragment>
      {zarr_columns.map(col_name => <td key={"zarr-" + col_name}>{renderColumn(col_name)}</td>)}
    </React.Fragment>
  );
}
