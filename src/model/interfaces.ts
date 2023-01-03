export {};

export type contextType =
  | 'it'
  | 'describe'
  | 'skipped_it'
  | 'skipped_describe'
  | 'commented_function_call'
  | 'function_call'
  | 'afterEach'
  | 'beforeEach'
  | 'before'
  | 'after'
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
  warning: IWarningDetails;
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

export interface IWarning {
  warningLevel?: number;
  message: string;
}

export interface IWarningDetails {
  hasWarning: boolean;
  warnings: { warningLevel?: number; message: string }[];
}

export interface IWarningConfig {
  warning?: (data: { status?: string; metaData: object }) => IWarningDetails;
  warningAsync?: (data: { status?: string; metaData: object }) => Promise<IWarningDetails>;
}

export interface IAnnotationConfig {
  key: string;
  /** Accepted meta data */
  metaData?: IMetaDataConfig[];
  warning?: IWarningConfig;
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
