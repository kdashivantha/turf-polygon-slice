import 'ol/ol.css';
import {Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import {fromLonLat } from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import Draw from 'ol/interaction/Draw';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Polygon from 'ol/geom/Polygon';
import Feature from 'ol/Feature';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';

import randomColor from 'randomColor';
import * as turf from '@turf/turf'
import polygonSlice from './turf/polygon-slice';


var styles = [
    new Style({
      stroke: new Stroke({
        color: 'blue',
        width: 3
      }),
      fill: new Fill({
        color: 'rgba(0, 0, 255, 0.1)'
      })
    })
];

var geojsonObject = {
'type': 'FeatureCollection',
'crs': {
    'type': 'name',
    'properties': {
    'name': 'EPSG:3857'
    }
},
'features': [
    {
        'type': 'Feature',
        'geometry': {
        'type': 'Polygon',
        'coordinates': [[
          [8893770.291433312,770745.0119364415],
          [8893759.54247621,770571.8342942329],
          [8893970.93863256,770580.1945942016],
          [8893975.715946829,770767.7041792137],
          [8893770.291433312,770745.0119364415]
        ]]
        }
    }
]
};

var source = new VectorSource({
features: (new GeoJSON()).readFeatures(geojsonObject)
});

var layer = new VectorLayer({
source: source,
style: styles,
zIndex: 1
});

const map = new Map({
  target: 'map',
  layers: [
    layer,
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


var draw;
function addInteraction() {

    let source = new VectorSource();
    let vector = new VectorLayer({
        source: source,
        zIndex: 2,
        style: new Style({
          fill: new Fill({
            color: 'rgba(255, 255, 255, 1)'
          }),
          stroke: new Stroke({
            color: 'rgba(0, 0, 0, 1)',
            lineDash: [10, 10],
            width: 4
          })
        })
    });
    map.addLayer(vector);

    draw = new Draw({
      source: source,
      type: 'LineString',
      style: new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 1)'
        }),
        stroke: new Stroke({
          color: 'rgba(0, 0, 0, 1)',
          lineDash: [10, 10],
          width: 4
        }),
        image: new CircleStyle({
          radius: 5,
          stroke: new Stroke({
            color: 'rgba(0, 0, 0, 1)'
          }),
          fill: new Fill({
            color: 'rgba(255, 255, 255, 1)'
          })
        })
      })
    });
    map.addInteraction(draw);   
}
addInteraction();

var resultsSource;
function addResultsLayer() {

    resultsSource = new VectorSource();
    let vector = new VectorLayer({
        source: resultsSource,
        zIndex: 3,
        style: function(feature) {
          return new Style({
            stroke: new Stroke({
                color: 'black',
                width: 1
            }),
                fill: new Fill({
                color: feature.get('color') || 'black'
            })
          })
        }
    });
    map.addLayer(vector);
}
addResultsLayer();


draw.on('drawend', function (event) {
    var feature = event.feature;

    var lineGeoJSON = new GeoJSON().writeFeatureObject(feature);
    var lineGeometry = turf.getGeom(lineGeoJSON);

    var features = layer.getSource().getFeatures();
    for (var i = 0; i < features.length; i++) {

      var featureGeoJSON = new GeoJSON().writeFeatureObject(features[i]);
      var featureGeometry = turf.getGeom(featureGeoJSON);

      //polygon slized
      var sliced = polygonSlice(featureGeometry, lineGeometry);
      console.log(sliced);
      //add shapes to map
      for (var k = 0; k < sliced.length; k++) {
        let shape = new Polygon(sliced[k].coordinates);
        let shapeFeature = new Feature(shape);
        
        shapeFeature.set('color', randomColor({
            luminosity: 'bright',
            format: 'rgb' // e.g. 'rgb(225,200,20)'
        }));

        resultsSource.addFeature(shapeFeature);
      }
    }
});
