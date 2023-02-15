
import React from "react";

import Papa from "papaparse";

import ImageItem from "./ImageItem";

export default function App() {

  const [tableData, setTableData] = React.useState([]);

  React.useEffect(() => {

    const params = new URLSearchParams(location.search);
    let csvUrl = params.get("csv");
    try {
      new URL(csvUrl);
    } catch (error) {
      csvUrl = "/zarr_samples.csv";
    }
    Papa.parse(csvUrl, {
      header: true,
      download: true,
      complete: function (results) {
        setTableData(results.data);
      },
    });
  }, []);

  let zarr_columns = [
    "URL",
    "Version",
    "Axes",
    "shape, chunks",
    "Wells",
    "Fields",
    "Keywords",
    "Thumbnail",
  ];

  let custom_columns = ["License", "Study", "DOI", "Date added"];

  function renderRow(rowdata) {
    return <React.Fragment>
      {custom_columns.map((col_name) => <td key={col_name}>{rowdata[col_name]}</td>)}
      </React.Fragment>
  }

  const validRows = tableData.filter(rowdata => rowdata.URL?.length > 0);

  const table_rows = validRows.map((rowdata) => {
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
          {custom_columns.map((name) => (
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
