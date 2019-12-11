import Map from "ol/Map";
import Draw from "ol/interaction/Draw";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import Feature from "ol/Feature";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import CircleStyle from "ol/style/Circle";

import GeoJSON from "ol/format/GeoJSON";
import randomColor from "randomColor";
import lineSplit from "@turf/line-split";
import { featureEach } from "@turf/meta";
import polygonSlice from "./turf/polygon-slice";

export class OLSplit {
  private _source: VectorSource;
  private _layer: VectorLayer;

  private _splitlineSource: VectorSource;
  private _splitlinelayer: VectorLayer;
  private _splitLineInterAction: Draw;

  private _selectedFeature: Feature;
  private _splitLineFeature: Feature;
  private format = new GeoJSON();

  constructor(private olMap: Map) {}

  public Initialize(): void {
    this.CreateDisplayLayer();
    this.CreateSplitSketchLayer();
    this._CreateSplitLineInteraction();
  }

  public DisposeSplit(): void {
    this.RemoveDisplayLayer();
    this.RemoveSplitSketchLayer();

    this.finishSplitLine();
    this._selectedFeature = undefined;
  }

  public SetSourceFeature(feature: Feature): void {
    if (!this._selectedFeature) {
      this._selectedFeature = feature;
      this._source.addFeature(this._selectedFeature);
      //start split-draw mode
      this.startSplitLine();
    }
  }

  public CreateDisplayLayer(): void {
    if (this._layer) return;

    this._source = new VectorSource();
    this._layer = new VectorLayer({
      source: this._source,
      zIndex: 998,
      style: function(feature) {
        //alter style for newest poly chunks
        if (feature.get("color")) {
          return new Style({
            stroke: new Stroke({
              color: "rgba(0,0,0,1)",
              width: 1
            }),
            fill: new Fill({
              color: feature.get("color") || "rgba(255, 255, 255, 0)"
            })
          });
        }
        //default style- for initial selection
        return new Style({
          stroke: new Stroke({
            color: "rgba(0,153,255,1)",
            width: 4
          }),
          fill: new Fill({
            color: "rgba(255, 255, 255, 0)"
          })
        });
      }
    });
    this.olMap.addLayer(this._layer);
  }
  public RemoveDisplayLayer(): void {
    this.olMap.removeLayer(this._layer);
    if (this._source) this._source.clear(true);

    this._layer = undefined;
    this._source = undefined;
  }

  public CreateSplitSketchLayer(): void {
    if (this._splitlinelayer) return;

    this._splitlineSource = new VectorSource({
      wrapX: false
    });

    this._splitlinelayer = new VectorLayer({
      source: this._splitlineSource,
      zIndex: 999,
      style: new Style({
        fill: new Fill({
          color: "rgba(255, 255, 255, 1)"
        }),
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 1)",
          lineDash: [10, 10],
          width: 2
        })
      })
    });
    this.olMap.addLayer(this._splitlinelayer);
  }
  public RemoveSplitSketchLayer(): void {
    this.olMap.removeLayer(this._splitlinelayer);

    this._splitlinelayer = undefined;
    this._splitlineSource = undefined;
  }

  private _CreateSplitLineInteraction(): void {
    if (this._splitLineInterAction) {
      this._splitLineInterAction.un(
        "drawend",
        this._onSplitLineDrawEnd.bind(this),
        this
      );
    }

    this._splitLineInterAction = new Draw({
      source: this._splitlineSource,
      type: /** @type {ol.geom.GeometryType} */ "LineString",
      style: new Style({
        fill: new Fill({
          color: "rgba(255, 255, 255, 1)"
        }),
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 1)",
          lineDash: [10, 10],
          width: 4
        }),
        image: new CircleStyle({
          radius: 5,
          stroke: new Stroke({
            color: "rgba(0, 0, 0, 1)"
          }),
          fill: new Fill({
            color: "rgba(255, 255, 255, 1)"
          })
        })
      })
    });

    this._splitLineInterAction.on(
      "drawend",
      this._onSplitLineDrawEnd.bind(this),
      this
    );

    return this._splitLineInterAction;
  }

  private startSplitLine(): void {
    if (this._splitLineInterAction) {
      this._splitLineInterAction.setActive(true);
      this.olMap.addInteraction(this._splitLineInterAction);
    }
  }
  private finishSplitLine(): void {
    if (!this._splitLineInterAction) return;

    this._splitLineInterAction.finishDrawing();
    this._splitLineInterAction.setActive(false);
    this.olMap.removeInteraction(this._splitLineInterAction);
  }

  private _onSplitLineDrawEnd(event): void {
    this._splitLineFeature = event.feature;

    var lineGeoJSON = this.format.writeFeatureObject(this._splitLineFeature, {
      dataProjection: "EPSG:4326",
      featureProjection: "EPSG:3857"
    });

    var featureGeoJSON = this.format.writeFeatureObject(this._selectedFeature, {
      dataProjection: "EPSG:4326",
      featureProjection: "EPSG:3857"
    });

    //line or polygon slized
    const geoType = featureGeoJSON.geometry.type;
    const sliced =
      geoType === "Polygon"
        ? polygonSlice(featureGeoJSON, lineGeoJSON)
        : lineSplit(featureGeoJSON, lineGeoJSON);

    //add shapes to map
    featureEach(sliced, slice => {
      let shapeFeature = this.format.readFeature(slice);
      shapeFeature.getGeometry().transform("EPSG:4326", "EPSG:3857");

      if (geoType === "Polygon") {
        shapeFeature.setStyle(
          new Style({
            fill: new Fill({
              color: randomColor({ luminosity: "bright", format: "rgb" })
            }),
            stroke: new Stroke({
              color: "rgb(0, 0, 0)",
              width: 2
            })
          })
        );
      } else {
        shapeFeature.setStyle([
          new Style({
            stroke: new Stroke({
              color: "rgb(0, 0, 0)",
              width: 5
            })
          }),
          new Style({
            stroke: new Stroke({
              color: randomColor({ luminosity: "bright", format: "rgb" }),
              width: 3
            })
          })
        ]);
      }

      this._source.addFeature(shapeFeature);
    });
  }

  /**
   * get features to display in modal-popup
   */
  public get Features(): Feature[] {
    return this._source.getFeatures();
  }
}
