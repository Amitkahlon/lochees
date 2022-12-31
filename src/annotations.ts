export class AnnotationsManager {
  config: IAnnotationsManagerConfig;

  constructor(config: IAnnotationsManagerConfig) {
    this.config = config;
  }

  get annotations() {
    return this.config.annotations;
  }

  public getAnnotations() {
    return this.config.annotations.map(a => a.key);
  }

    public getAnnotation(key: string) {
      if(!key) return null;

      return this.config.annotations.find(a => {
        let curr = a.settings.caseSensitive ? a.key : a.key.toLowerCase();
        let expected = a.settings.caseSensitive ? key : key.toLowerCase();
        
        return curr === expected;
      })      
    }

    public getMetaData(key: string, annotation: IAnnotationConfig) {
      return annotation.metaData.find(m => m.key === key);
    }



  
    
}

export interface IAnnotationsManagerConfig {
  annotations: IAnnotationConfig[]
}

export interface ICaseSensitive {
  caseSensitive?: boolean
}

export interface IAnnotationConfig {
  key: string;
    /** Accepted meta data */
    metaData?: IMetaData[];
    printMessage?: string;
  settings?: {
    acceptStatus?: boolean;
  } & ICaseSensitive


}

export interface IMetaData extends ICaseSensitive {
  key: string;
  settings?: {
    type?: metaDataType,
    maxLines?: number
  };
}



export enum metaDataType {
  multiLine,
  oneLine
}
