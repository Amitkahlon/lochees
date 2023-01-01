export {};

export type contextType =
  | 'it'
  | 'describe'
  | 'skipped_it'
  | 'skipped_describe'
  | 'commented_function_call'
  | 'function_call'
  | 'no_context';

export interface IContext {
  name?: string;
  lineIndex?: number;
  type?: contextType;
}

export interface IReport {
  key: string;
  status: string;
  metaData: object;
  line: number;
  context: IContext;
  file: string;
}

export type configDefaults = { maxLines: number };

export interface IAnnotationsManagerConfig {
  annotations: IAnnotationConfig[];
  defaults: configDefaults;
}

export type printMessageBuilder = (params: Partial<IReport>) => string;

export interface ICaseSensitive {
  caseSensitive?: boolean;
}

export interface IAnnotationConfig {
  key: string;
  /** Accepted meta data */
  metaData?: IMetaDataConfig[];
  printMessage?: printMessageBuilder;
  settings?: {
    acceptStatus?: boolean;
  } & ICaseSensitive;
}

export interface IMetaDataConfig extends ICaseSensitive {
  key: string;
  settings?: {
    type?: metaDataType;
    maxLines?: number;
  };
}



export enum metaDataType {
  multiLine,
  oneLine,
}
