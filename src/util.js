import {
  ContainsArrayError,
  HTTPStore,
  openArray,
  openGroup,
  ZarrArray,
} from "zarr";

export const MAX_CHANNELS = 6;

export const COLORS = {
  cyan: '#00FFFF',
  yellow: '#FFFF00',
  magenta: '#FF00FF',
  red: '#FF0000',
  green: '#00FF00',
  blue: '#0000FF',
  white: '#FFFFFF',
};
export const MAGENTA_GREEN = [COLORS.magenta, COLORS.green];
export const RGB = [COLORS.red, COLORS.green, COLORS.blue];
export const CYMRGB = Object.values(COLORS).slice(0, -2);

import { ZarrPixelSource } from "@vivjs/loaders";

export function range(length) {
  return Array.from({ length }, (_, i) => i);
}

async function normalizeStore(source) {
  let path;
  if (typeof source === "string") {
    let store;

    // if (source.endsWith('.json')) {
    //   // import custom store implementation```
    //   const [{ ReferenceStore }, json] = await Promise.all([
    //     import('reference-spec-reader'),
    //     fetch(source).then((res) => res.json()),
    //   ]);

    //   store = ReferenceStore.fromJSON(json);
    // } else {
    const url = new URL(source);
    store = new HTTPStore(url.origin);
    path = url.pathname.slice(1);
    // }

    // Wrap remote stores in a cache
    // return { store: new LRUCacheStore(store), path };
    return { store, path };
  }

  return { store: source, path };
}

export async function open(source) {
  const { store, path } = await normalizeStore(source);
  return openGroup(store, path).catch((err) => {
    if (err instanceof ContainsArrayError) {
      return openArray({ store });
    }
    throw err;
  });
}

async function loadMultiscales(grp, multiscales) {
  const { datasets } = multiscales[0] || [{ path: "0" }];
  const nodes = await Promise.all(
    datasets.map(({ path }) => grp.getItem(path))
  );
  if (nodes.every((node) => node instanceof ZarrArray)) {
    return nodes;
  }
  throw Error("Multiscales metadata included a path to a group.");
}

export function getNgffAxes(multiscales) {
  // Returns axes in the latest v0.4+ format.
  // defaults for v0.1 & v0.2
  const default_axes = [
    { type: "time", name: "t" },
    { type: "channel", name: "c" },
    { type: "space", name: "z" },
    { type: "space", name: "y" },
    { type: "space", name: "x" },
  ];
  function getDefaultType(name) {
    if (name === "t") return "time";
    if (name === "c") return "channel";
    return "space";
  }
  let axes = default_axes;
  // v0.3 & v0.4+
  if (multiscales[0].axes) {
    axes = multiscales[0].axes.map((axis) => {
      // axis may be string 'x' (v0.3) or object
      if (typeof axis === "string") {
        return { name: axis, type: getDefaultType(axis) };
      }
      const { name, type } = axis;
      return { name, type: type ?? getDefaultType(name) };
    });
  }
  return axes;
}

function getNgffAxisLabels(axes) {
  return axes.map((axis) => axis.name);
}

export function isInterleaved(shape) {
  const lastDimSize = shape[shape.length - 1];
  return lastDimSize === 3 || lastDimSize === 4;
}

export function guessTileSize(arr) {
  const interleaved = isInterleaved(arr.shape);
  const [ySize, xSize] = arr.chunks.slice(interleaved ? -3 : -2);
  const size = Math.min(ySize, xSize);
  // Needs to be a power of 2 for deck.gl
  return 2 ** Math.floor(Math.log2(size));
}

export function hexToRGB(hex) {
  if (hex.startsWith("#")) hex = hex.slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return [r, g, b];
}

export async function calcDataRange(source, selection) {
  if (source.dtype === 'Uint8') return [0, 255];
  const { data } = await source.getRaster({ selection });
  let minVal = Infinity;
  let maxVal = -Infinity;
  for (let i = 0; i < data.length; i++) {
    if (data[i] > maxVal) maxVal = data[i];
    if (data[i] < minVal) minVal = data[i];
  }
  if (minVal === maxVal) {
    minVal = 0;
    maxVal = 1;
  }
  return [minVal, maxVal];
}

export async function calcConstrastLimits(
  source,
  channelAxis,
  visibilities,
  defaultSelection
) {
  const def = defaultSelection ?? source.shape.map(() => 0);
  const csize = source.shape[channelAxis];

  if (csize !== visibilities.length) {
    throw new Error("provided visibilities don't match number of channels");
  }

  return Promise.all(
    visibilities.map(async (isVisible, i) => {
      if (!isVisible) return undefined; // don't compute non-visible channels
      const selection = [...def];
      selection[channelAxis] = i;
      return calcDataRange(source, selection);
    })
  );
}

export function getDefaultVisibilities(n) {
  let visibilities;
  if (n <= MAX_CHANNELS) {
    // Default to all on if visibilities not specified and less than 6 channels.
    visibilities = Array(n).fill(true);
  } else {
    // If more than MAX_CHANNELS, only make first set on by default.
    visibilities = [
      ...Array(MAX_CHANNELS).fill(true),
      ...Array(n - MAX_CHANNELS).fill(false),
    ];
  }
  return visibilities;
}

export function getDefaultColors(n, visibilities) {
  let colors = [];
  if (n == 1) {
    colors = [COLORS.white];
  } else if (n == 2) {
    colors = MAGENTA_GREEN;
  } else if (n === 3) {
    colors = RGB;
  } else if (n <= MAX_CHANNELS) {
    colors = CYMRGB.slice(0, n);
  } else {
    // Default color for non-visible is white
    colors = Array(n).fill(COLORS.white);
    // Get visible indices
    const visibleIndices = visibilities.flatMap((bool, i) => (bool ? i : []));
    // Set visible indices to CYMRGB colors. visibleIndices.length === MAX_CHANNELS from above.
    for (const [i, visibleIndex] of visibleIndices.entries()) {
      colors[visibleIndex] = CYMRGB[i];
    }
  }
  return colors.map(hexToRGB);
}

async function defaultMeta(loader, axis_labels) {
  const channel_axis = axis_labels.indexOf("c");
  const channel_count = loader.shape[channel_axis];
  const visibilities = getDefaultVisibilities(channel_count);
  const contrast_limits = await calcConstrastLimits(
    loader,
    channel_axis,
    visibilities
  );
  const colors = getDefaultColors(channel_count, visibilities);
  return {
    name: "Image",
    names: range(channel_count).map((i) => `channel_${i}`),
    colors,
    contrastLimits: contrast_limits,
    channelsVisible: visibilities,
    channel_axis: axis_labels.includes("c") ? axis_labels.indexOf("c") : null,
    defaultSelection: axis_labels.map(() => 0),
  };
}

function parseOmeroMeta({ rdefs, channels, name }, axes) {
  const t = rdefs.defaultT ?? 0;
  const z = rdefs.defaultZ ?? 0;

  const colors = [];
  const contrast_limits = [];
  const visibilities = [];
  const names = [];

  channels.forEach((c, index) => {
    colors.push(hexToRGB(c.color));
    contrast_limits.push([c.window.start, c.window.end]);
    visibilities.push(c.active);
    names.push(c.label || "" + index);
  });

  const defaultSelection = axes.map((axis) => {
    if (axis.type == "time") return t;
    if (axis.name == "z") return z;
    return 0;
  });
  const channel_axis = axes.findIndex((axis) => axis.type === "channel");

  return {
    name,
    names,
    colors,
    contrastLimits: contrast_limits,
    channelsVisible: visibilities,
    channel_axis,
    defaultSelection,
  };
}

// Scales the real image size to the target viewport.
export function fitBounds(
  [width, height],
  [targetWidth, targetHeight],
  maxZoom,
  padding
) {
  const scaleX = (targetWidth - padding * 2) / width;
  const scaleY = (targetHeight - padding * 2) / height;
  const zoom = Math.min(maxZoom, Math.log2(Math.min(scaleX, scaleY)));
  return { zoom, target: [width / 2, height / 2] };
}

export async function loadOmeroMultiscales(config, zarrGroup, attrs) {
  const { name, opacity = 1, colormap = "" } = config;
  let data = await loadMultiscales(zarrGroup, attrs.multiscales);
  const axes = getNgffAxes(attrs.multiscales);
  const axis_labels = getNgffAxisLabels(axes);
  const tileSize = guessTileSize(data[0]);

  const loaders = data.map(
    (arr) => new ZarrPixelSource(arr, axis_labels, tileSize)
  );
  const meta =
    "omero" in attrs
      ? parseOmeroMeta(attrs.omero, axes)
      : await defaultMeta(loaders[0], axis_labels);

  return {
    loader: loaders,
    axis_labels,
    ...meta,
    name: meta.name ?? name,
  };
}


export function renderTo8bitArray(ndChunks, minMaxValues, colors) {
  // Render chunks (array) into 2D 8-bit data for new ImageData(arr)
  // ndChunks is list of zarr arrays

  // assume all chunks are same shape
  const shape = ndChunks[0].shape;
  const height = shape[0];
  const width = shape[1];

  if (!minMaxValues) {
    minMaxValues = ndChunks.map(getMinMaxValues);
  }

  // let rgb = [255, 255, 255];

  const rgba = new Uint8ClampedArray(4 * height * width).fill(0);
  let offset = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let p = 0; p < ndChunks.length; p++) {
        let rgb = colors[p];
        let data = ndChunks[p].data;
        let range = minMaxValues[p];
        let rawValue = data[y][x];
        let fraction = (rawValue - range[0]) / (range[1] - range[0]);
        // for red, green, blue,
        for (let i = 0; i < 3; i++) {
          // rgb[i] is 0-255...
          let v = (fraction * rgb[i]) << 0;
          // increase pixel intensity if value is higher
          rgba[offset * 4 + i] = Math.max(rgba[offset * 4 + i], v);
        }
      }
      rgba[offset * 4 + 3] = 255; // alpha
      offset += 1;
    }
  }
  return rgba;
}

export function getMinMaxValues(chunk2d) {
  const shape = chunk2d.shape;
  const height = shape[0];
  const width = shape[1];
  const data = chunk2d.data;
  let maxV = 0;
  let minV = Infinity;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rawValue = data[y][x];
      maxV = Math.max(maxV, rawValue);
      minV = Math.min(minV, rawValue);
    }
  }
  return [minV, maxV];
}

