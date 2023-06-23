
# ome-zarr-catalog

An app for hosting a catalog of OME-Zarr samples: Images and Plates supported.

You provide a list of OME-Zarr samples as a CSV table and the app loads metadata and displays a
thumbnail of each image in a table.

The apps is deployed at https://ome.github.io/ome-zarr-catalog/.
You simply need to specify the location of your CSV file after the URL as `?csv=URL_to_your_table.csv.

For example a CSV file like this is hosted in this repo under `public/zarr_samples.csv`.

```
URL,                                                                   License,    Study,    Date added
https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.4/idr0054A/5025553.zarr,   CC BY 4.0,  idr0054,  2022-06-03
https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.4/idr0076A/10501752.zarr,  CC BY 4.0,  idr0076,  2022-06-21
https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.4/idr0047A/4496763.zarr,   CC BY 4.0,  idr0047,  2022-06-21
https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.4/idr0062A/6001240.zarr,   CC BY 4.0,  idr0062,  2022-06-21
```

It's raw URL is https://raw.githubusercontent.com/ome/ome-zarr-catalog/main/public/zarr_samples.csv
and we can use that to display it as a catalog page:

https://ome.github.io/ome-zarr-catalog/?csv=https://raw.githubusercontent.com/ome/ome-zarr-catalog/main/public/zarr_samples.csv

This adds a single `Thumbnail` column to the data in the `CSV` file.

<img src="https://user-images.githubusercontent.com/900055/248266041-cbc4b1a1-79ee-4243-a8a0-150f5b176fdd.png" width="600px" />


We can specify which columns from the following list to add:

  - `Version` - Adds a column with the OME-NGFF version
  - `Axes` - Displays the `axes` of the Image
  - `shape` - Displays the `shape` of the Zarr data at highest resolution
  - `chunks` - Displays the `chunks` of the Zarr data at highest resolution
  - `Wells` - Shows the `Well` count for Plate data
  - `Fields`- Shows the `Fields` count for Plate data
  - `Keywords` - Adds `labels` paths, `plate` and/or `bioformats2raw.layout`
  - `Thumbnail` - Renders the smallest multiscales dataset as a Thumbnail

These can be specified as a URL query string, e.g. `...&columns=Axes,Thumbnail,shape,chunks`

<img src="https://user-images.githubusercontent.com/900055/248266063-80ec63fc-e6df-457e-bd09-567971705c53.png" width="800px" />

