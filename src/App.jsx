
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

  // check for ?csv=url
  const params = new URLSearchParams(location.search);
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
    // If no valid URL provided, use default
    csvUrl = zarr_samples_csv;
  }


  React.useEffect(() => {

    // load csv and use this for the left side of the table...
    Papa.parse(csvUrl, {
      header: true,
      download: true,
      complete: function (results) {
        setTableData(results.data);
        setTableColumns(results.meta.fields);
      },
    });
  }, []);

  return <CatelogTable tableColumns={tableColumns} zarrColumns={zarrColumns} tableData={tableData} />
}
