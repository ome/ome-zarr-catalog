
import React from "react";

import ImageItem from "./ImageItem";
import ZarrUrl from "./ZarrUrl";


export default function CatelogTable({tableColumns, tableData, zarrColumns}) {

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

  // ignore any row without a "URL" field
  const validRows = tableData.filter(rowdata => rowdata.URL?.length > 0);

  const table_rows = validRows.map((rowdata) => {
    // Each row is a combination of custom csv data and NGFF Image data
    return (<tr key={rowdata["URL"]}>
        {renderRow(rowdata)}
        <ImageItem
          source={rowdata["URL"]}
          zarr_columns={zarrColumns}
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
          {zarrColumns.map((name) => (
            <th key={name}>{name}</th>
          ))}
        </tr>
        {table_rows}
      </tbody>
    </table>
  );
}
