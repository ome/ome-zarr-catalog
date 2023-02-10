/// app.js
import React from "react";

import ImageItem from "./ImageItem";

import zarr_samples_json from "../public/zarr_samples.json";

// DeckGL react component
export default function App() {
  let sources = zarr_samples_json.urls;

  let items = sources.map((source) => <ImageItem key={source} source={source}/>);

  return (
    <table>
      <tbody>
        <tr>
          <th>Version</th>
          <th>s3 URL</th>
          <th>shape, chunks</th>
          <th>Axes</th>
          <th>Wells</th>
          <th>Fields</th>
          <th>Keywords</th>
          <th>Thumbnail</th>
        </tr>
        {items}
      </tbody>
    </table>
  );
}
