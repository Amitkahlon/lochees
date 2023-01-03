/// <reference path="./model/interfaces.ts" />

import {
  IAnnotationsManagerConfig,
  IAnnotationConfig,
  IMetaDataConfig,
  printMessageBuilder,
  ICaseSensitive,
  configDefaults,
  IWarningConfig,
} from './model/interfaces';

export class ConfigManager {
  config: IAnnotationsManagerConfig;

  constructor(builder: (configBuilder: configBuilder) => void) {
    const cb = new configBuilder();
    builder(cb);

    this.config = cb.finishConfig();
  }

  get annotations() {
    return this.config.annotations;
  }

  public getAnnotations() {
    return this.config.annotations.map((a) => a.key);
  }

  public getAnnotation(key: string) {
    if (!key) return null;

    return this.config.annotations.find((a) => {
      let curr = a.settings.caseSensitive ? a.key : a.key.toLowerCase();
      let expected = a.settings.caseSensitive ? key : key.toLowerCase();

      return curr === expected || curr + ":" === expected;
    });
  }

  public getMetaData(key: string, annotation: IAnnotationConfig) {
    return annotation.metaData.find((m) => m.key === key);
  }
}

class AnnotationBuilder {
  private annotation: IAnnotationConfig;
  constructor(annotation: IAnnotationConfig) {
    this.annotation = annotation;
    this.annotation.metaData = [];
  }

  addMetaData(metaDataProperties: IMetaDataConfig): AnnotationBuilder {
    this.annotation.metaData.push(metaDataProperties);

    return this;
  }

  addWarning(warning: IWarningConfig) {
    this.annotation.warning = warning;
    return null;
  }
}

export class configBuilder {
  private readonly MAX_LINES = 3;
  private config: IAnnotationsManagerConfig = { annotations: [], defaults: { maxLines: this.MAX_LINES } };
  private globalMetaData: IMetaDataConfig[] = [];

  public finishConfig() {
    if (this.globalMetaData.length) {
      this.globalMetaData.forEach((gmd) =>
        this.config.annotations.forEach((annotation) => {
          annotation.metaData.push(gmd);
        })
      );
    }

    return this.config;
  }


  addAnnotation(annotationProperties: {
    key: string;
    printMessage?: printMessageBuilder;
    settings?: {
      acceptStatus?: boolean;
    } & ICaseSensitive;
  }) {
    const { key, printMessage, settings } = annotationProperties;

    const newAnnotation = { key, printMessage, settings };
    this.config.annotations.push(newAnnotation);

    return new AnnotationBuilder(newAnnotation);
  }

  addGlobalMetaData(metaDataProperties: IMetaDataConfig) {
    this.globalMetaData.push(metaDataProperties);
    return this;
  }

  setDefaults(newDefaults: Partial<configDefaults>) {
    this.config.defaults = Object.assign({}, this.config.defaults, newDefaults);
  }
}
