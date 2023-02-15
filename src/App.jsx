
import React from "react";

import Papa from "papaparse";

import ImageItem from "./ImageItem";
import ZarrUrl from "./ZarrUrl";

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
  // columns=Version,Axes,shape,chunks,Wells,Fields,Keywords,Thumbnail,
  let cols = params.get("columns");
  console.log("cols", cols);
  let zarr_columns = [];
  if (cols) {
    zarr_columns = cols.split(",").filter(col => supportedColumns.includes(col));
  } else {
    zarr_columns = defaultColumns;
  }
  console.log("zarr_columsn", zarr_columns)
  try {
    new URL(csvUrl);
  } catch (error) {
    csvUrl = "/zarr_samples.csv";
  }


  React.useEffect(() => {

    Papa.parse(csvUrl, {
      header: true,
      download: true,
      complete: function (results) {
        setTableData(results.data);
        setTableColumns(results.meta.fields);
      },
    });
  }, []);


  function renderRow(rowdata) {
    return <React.Fragment>
      {tableColumns.map((col_name) => {
        if (col_name == "URL") {
          return <td key={col_name}><ZarrUrl source={rowdata[col_name]} /></td>
        } else {
          return <td key={col_name}>{rowdata[col_name]}</td>
        }
  })}
      </React.Fragment>
  }

  const validRows = tableData.filter(rowdata => rowdata.URL?.length > 0);

  const table_rows = validRows.map((rowdata) => {
    // Each row is a combination of custom table data and NGFF Image data
    return (<tr key={rowdata["URL"]}>
        {renderRow(rowdata)}
        <ImageItem
          source={rowdata["URL"]}
          zarr_columns={zarr_columns}
        />
      </tr>
    );
  });

  return (
    <table>
      <tbody>
        <tr>
          {tableColumns.map((name) => (
            <th key={name}>{name}</th>
          ))}
          {zarr_columns.map((name) => (
            <th key={name}>{name}</th>
          ))}
        </tr>
        {table_rows}
      </tbody>
    </table>
  );
}
