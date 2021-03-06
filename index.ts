import GeoJSON from "ol/format/GeoJSON";
import OSM from "ol/source/OSM";
import TileLayer from "ol/layer/Tile";
import Map from "ol/Map";
import View from "ol/View";
import { fromLonLat } from "ol/proj";
import { OLSplit } from "./OLSplit";

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
            [8892725.253937205, 771169.2971598529],
            [8892724.955355063, 771164.8184277269],
            [8892676.28646596, 771166.3113384355],
            [8892676.28646596, 771151.3822313487],
            [8892721.969533646, 771151.979395632],
            [8892721.969533646, 771114.358045773],
            [8892713.90781582, 771114.358045773],
            [8892713.310651535, 771145.7091706556],
            [8892668.821912417, 771146.0077527973],
            [8892668.523330275, 771131.6758099939],
            [8892704.054605141, 771129.5857350017],
            [8892704.054605141, 771119.4339421826],
            [8892668.821912417, 771119.4339421826],
            [8892668.224748133, 771055.5373638504],
            [8892705.248933708, 771053.4472888582],
            [8892705.846097993, 771035.5323603539],
            [8892667.62758385, 771036.1295246374],
            [8892668.523330275, 770998.5081747783],
            [8892712.713487253, 770999.7025033452],
            [8892712.713487253, 771106.8934922295],
            [8892724.656772923, 771106.5949100878],
            [8892725.85110149, 771000.001085487],
            [8892735.107147884, 771000.5982497705],
            [8892737.79438716, 771106.5949100878],
            [8892744.66177642, 771106.5949100878],
            [8892745.856104987, 771000.001085487],
            [8892787.956186973, 770998.2095926364],
            [8892788.689070407, 771012.8401175817],
            [8892788.390488267, 771067.48064952],
            [8892753.754959824, 771066.8834852364],
            [8892754.053541966, 771076.4381137721],
            [8892794.660713242, 771077.6324423391],
            [8892795.556459667, 771094.6516244182],
            [8892753.456377683, 771096.4431172686],
            [8892753.754959824, 771104.8034172374],
            [8892786.897577558, 771104.8034172374],
            [8892786.598995415, 771118.5381957573],
            [8892752.560631257, 771120.3296886077],
            [8892753.456377683, 771130.1828992851],
            [8892789.584816834, 771132.571556419],
            [8892789.584816834, 771145.1120063721],
            [8892795.257877527, 771145.1120063721],
            [8892795.257877527, 771166.6099205773],
            [8892735.242867036, 771165.714174152],
            [8892736.138613462, 771169.2971598529],
            [8892725.688238502, 771169.2971598529],
            [8892725.253937205, 771169.2971598529]
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
      center: fromLonLat([79.88477617544156, 6.910214879030562]),
      zoom: 18
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
