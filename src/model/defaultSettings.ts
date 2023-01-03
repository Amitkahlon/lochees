import { IMetaDataConfig, metaDataType } from './interfaces';

export const DEFAULT_META_DATA: { issue: IMetaDataConfig; notes: IMetaDataConfig; todo: IMetaDataConfig } = {
  issue: { key: 'issue:', settings: { type: metaDataType.oneLine }, caseSensitive: false },
  notes: { key: 'notes:', settings: { type: metaDataType.multiLine, maxLines: 3 }, caseSensitive: false },
  todo: { key: 'todo:', settings: { type: metaDataType.multiLine, maxLines: 2 }, caseSensitive: false },
};

export type skip_status = 'bug' | 'bug - missing issue' | 'wip' | 'broken' | 'deprecated';
