import GeoJSON from "ol/format/GeoJSON";
import OSM from "ol/source/OSM";
import TileLayer from "ol/layer/Tile";
import Map from "ol/Map";
import View from "ol/View";
import { fromLonLat } from "ol/proj";
import { OLSplit } from "./OLSplit";
import Feature from "ol/Feature";

var geojsonObject = {
  type: "FeatureCollection",
  crs: {
    type: "name",
    properties: {
      name: "EPSG:3857"
    }
  },
  features: [
    {
      type: "Feature",
      id: 1,
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [8893770.291433312, 770745.0119364415],
            [8893759.54247621, 770571.8342942329],
            [8893970.93863256, 770580.1945942016],
            [8893975.715946829, 770767.7041792137],
            [8893770.291433312, 770745.0119364415]
          ]
        ]
      }
    }
  ]
};

function init() {
  const map = new Map({
    target: "map",
    layers: [
      new TileLayer({
        source: new OSM(),
        zIndex: 0
      })
    ],
    view: new View({
      center: fromLonLat([79.895042, 6.906462]),
      zoom: 17
    })
  });

  let olSplit = new OLSplit(map);
  olSplit.Initialize();

  var features = new GeoJSON().readFeatures(geojsonObject);
  features.forEach(function(feature) {
    feature.setId(undefined);
  });

  olSplit.SetSourceFeature(features[0]);
}

init();
