export class AnnotationsManager {
  config: IAnnotationsManagerConfig;

  constructor(config: IAnnotationsManagerConfig) {
    this.config = config;
  }

  public getAnnotations() {
    return this.config.annotations.map(a => a.name);
  }

  
}

export interface IAnnotationsManagerConfig {
  annotations: IAnnotationConfig[]
}

export interface IAnnotationConfig {
  name: string;
  settings?: {
    acceptStatus?: boolean;
  }
  /** Accepted meta data */
  metaData?: IMetaData[];
}

export class IMetaData {
  name: string;
  settings?: {
    type?: metaDataType
  };
}

export enum metaDataType {
  multiLine,
  oneLine
}