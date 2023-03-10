
import React from "react";

import Papa from "papaparse";

import CatelogTable from "./CatelogTable";

const zarr_samples_csv = "https://raw.githubusercontent.com/ome/ome-zarr-catalog/main/public/zarr_samples.csv";

const supportedColumns = [
  "Version",
  "Axes",
  "shape",
  "chunks",
  "Wells",
  "Fields",
  "Keywords",
  "Thumbnail",
];

const defaultColumns = [
  "Thumbnail"
]

export default function App() {

  const [tableData, setTableData] = React.useState([]);
  const [tableColumns, setTableColumns] = React.useState([]);

  const location = window.location.href;
  let showPlaceholder = false;

  // check for ?csv=url
  const params = new URLSearchParams(window.location.search);
  let csvUrl = params.get("csv");
  // columns=Version,Thumbnail etc from supportedColumns
  let cols = params.get("columns");
  let zarrColumns = [];
  if (cols) {
    zarrColumns = cols.split(",").filter(col => supportedColumns.includes(col));
  } else {
    zarrColumns = defaultColumns;
  }
  try {
    new URL(csvUrl);

  } catch (error) {
    showPlaceholder = true;
  }


  React.useEffect(() => {

    if (csvUrl) {
      // load csv and use this for the left side of the table...
      Papa.parse(csvUrl, {
        header: true,
        download: true,
        complete: function (results) {
          setTableData(results.data);
          setTableColumns(results.meta.fields);
        },
      });
    }
  }, []);

  if (showPlaceholder) {
    return <p>
      To display a table of Zarr data, load a CSV table with a URL column.
      For example <a href={location + "?csv=" + zarr_samples_csv}>{location + "?csv=" + zarr_samples_csv}</a>
    </p>
  }
  return <CatelogTable tableColumns={tableColumns} zarrColumns={zarrColumns} tableData={tableData} />
}
