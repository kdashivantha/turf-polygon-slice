import {
  point,
  polygon,
  multiPolygon,
  lineString,
  featureCollection,
  FeatureCollection,
  Polygon
} from "@turf/helpers";
import lineIntersect from "@turf/line-intersect";
import lineOffset from "@turf/line-offset";
import lineOverlap from "@turf/line-overlap";
import lineToPolygon from "@turf/line-to-polygon";
import unkinkPolygon from "@turf/unkink-polygon";
import difference from "@turf/difference";
import { getGeom } from "@turf/invariant";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

/**
 * Slices {@link Polygon} using a {@link Linestring}.
 *
 * @name polygonSlice
 * @param {Feature<Polygon>} poly Polygon to slice
 * @param {Feature<LineString>} splitter LineString used to slice Polygon
 * @returns {FeatureCollection<Polygon>} Sliced Polygons
 * @example
 * var polygon = {
 *   "geometry": {
 *     "type": "Polygon",
 *     "coordinates": [[
 *         [0, 0],
 *         [0, 10],
 *         [10, 10],
 *         [10, 0],
 *         [0, 0]
 *     ]]
 *   }
 * };
 * var linestring =  {
 *     "type": "Feature",
 *     "properties": {},
 *     "geometry": {
 *       "type": "LineString",
 *       "coordinates": [
 *         [5, 15],
 *         [5, -15]
 *       ]
 *     }
 *   }
 * var sliced = polygonSlice(polygon, linestring);
 * //=sliced
 */
export default function polygonSlice(
  poly,
  splitter
): FeatureCollection<Polygon> {
  poly = getGeom(poly);
  splitter = getGeom(splitter);

  var line = trimStartEndPoints(poly, splitter);
  if (line == null) return featureCollection(poly);

  var newPolygons = [];

  var cutDone = false;
  var upperCut = cutPolygon(poly, line, 1, "upper");
  var lowerCut = cutPolygon(poly, line, -1, "lower");
  if (upperCut != null && lowerCut != null) {
    cutDone = true;
  }
  if (cutDone) {
    newPolygons.push(upperCut.geometry);
    newPolygons.push(lowerCut.geometry);
  } else {
    newPolygons.push(poly);
  }

  let generatedPolygons = [];
  newPolygons.forEach(polyg => {
    if (polyg.type == "Polygon") {
      generatedPolygons.push(polyg);
    }

    if (polyg.type == "MultiPolygon") {
      polyg.coordinates.forEach(p => {
        generatedPolygons.push(polygon([p[0]]).geometry);
      });
    }
  });

  return featureCollection(generatedPolygons.map(p => polygon(p.coordinates)));
}

function cutPolygon(poly, line, direction, id) {
  var j;
  var cutPolyGeoms = [];
  var retVal = null;

  if (poly.type != "Polygon" || line.type != "LineString") return retVal;

  var intersectPoints = lineIntersect(poly, line);
  var nPoints = intersectPoints.features.length;
  if (nPoints == 0 || nPoints % 2 != 0) return retVal;

  var thickLinePolygon = prepareDiffLinePolygon(line, direction);

  var clipped;
  try {
    clipped = difference(poly, thickLinePolygon);
  } catch (e) {
    return retVal;
  }

  if (clipped.geometry.type == "MultiPolygon") {
    for (j = 0; j < clipped.geometry.coordinates.length; j++) {
      //@ts-ignore
      var polyg = polygon(clipped.geometry.coordinates[j]);
      var overlap = lineOverlap(polyg, line, { tolerance: 0.00005 });

      if (overlap.features.length > 0) {
        cutPolyGeoms.push(polyg.geometry.coordinates);
      }
    }
  } else {
    var polyg = polygon(clipped.geometry.coordinates);
    var overlap = lineOverlap(polyg, line, { tolerance: 0.00005 });

    if (overlap.features.length > 0) {
      cutPolyGeoms.push(polyg.geometry.coordinates);
    }
  }

  if (cutPolyGeoms.length == 1) {
    retVal = polygon(cutPolyGeoms[0], { id: id });
  } else if (cutPolyGeoms.length > 1) {
    retVal = multiPolygon(cutPolyGeoms, { id: id });
  }

  return retVal;
}
/**
 * return non self intersection polygon
 * for difference-cutting
 */
function prepareDiffLinePolygon(line, direction) {
  let j,
    k,
    offsetLine,
    polyCoords = [],
    thickLinePolygon;

  const offsetScales = [0.01, 0.001, 0.0001];

  for (j = 0; j < offsetScales.length; j++) {
    polyCoords = [];
    offsetLine = lineOffset(line, offsetScales[j] * direction, {
      units: "kilometers"
    });
    for (k = 0; k < line.coordinates.length; k++) {
      polyCoords.push(line.coordinates[k]);
    }
    for (k = offsetLine.geometry.coordinates.length - 1; k >= 0; k--) {
      polyCoords.push(offsetLine.geometry.coordinates[k]);
    }
    polyCoords.push(line.coordinates[0]);
    let thickLineString = lineString(polyCoords);
    thickLinePolygon = lineToPolygon(thickLineString);

    let result = unkinkPolygon(thickLinePolygon);

    let selfIntersectPolygons = result.features.length;

    if (selfIntersectPolygons == 1) {
      return thickLinePolygon;
    }
  }
  //finaly
  return thickLinePolygon;
}

/**
 * Prepare linestrings from polygon-cut
 * avoid start and end points inside polygon for calculation
 */
function trimStartEndPoints(poly, line) {
  let j;
  let startAt = 0;
  let endAt = line.coordinates.length;

  for (j = 0; j < line.coordinates.length; j++) {
    if (booleanPointInPolygon(point(line.coordinates[j]), poly)) {
      startAt++;
    } else {
      break;
    }
  }

  for (j = line.coordinates.length - 1; j >= 0; j--) {
    if (booleanPointInPolygon(point(line.coordinates[j]), poly)) {
      endAt--;
    } else {
      break;
    }
  }

  line.coordinates = line.coordinates.slice(startAt, endAt);

  return line.coordinates.length > 1 ? line : null;
}
