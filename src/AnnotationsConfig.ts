export class AnnotationsManager {
  annotations;

  constructor() {

  }
}

export class AnnotationConfig {
  name: string;
  settings: {
    acceptStatus: boolean;
  }
  /** Accepted meta data */
  metaData: MetaData[];
}

export class MetaData {
  name: string;
  settings: {
    type: metaDataType
  };
}

enum metaDataType {
  multiLine,
  oneLine
}