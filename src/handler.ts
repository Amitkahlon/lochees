
import StrUtils from './StrUtils';
const strUtils = new StrUtils();

export const handler = (b) => {
  b.addAnnotation({
    key: '-skip',
    printMessage: ({ metaData, status, file, context, key, line }) => {
      let sb = `File: ${file} line: ${line}\n` + `Key: SKIP\n` + `Status: ${status}\n`;

      const { lineIndex, name, type } = context;
      if (type !== 'no_context') {
        sb += 'Context:\n' + `\tName: ${name}\n` + `\tType: "${type}"\n` + `\tline: ${lineIndex}\n`;
      } else {
        sb += `Context: No context found, make sure you placed your flag correctly\n`;
      }

      if (metaData) {
        sb += `Meta Data:\n`;
        for (const metaDataKey in metaData) {
          const metaDataDetails = metaData[metaDataKey] as string;
          sb += `\t${metaDataKey}:\n`;
          sb +=
            '\t\t' +
            strUtils
              .splitToLines(metaDataDetails)
              .map((m) => m.trim())
              .join('\n\t\t');
          sb += '\n';
        }
      }

      return sb;
    },
    settings: { acceptStatus: true, caseSensitive: false },
  }).addMetaData(DEFAULT_META_DATA.issue);

  b.addAnnotation({
    key: '-plaster',
    settings: { acceptStatus: false, caseSensitive: false },
    printMessage: ({ context, file, key, line, metaData, status }) => {
      let sb = `File: ${file} line: ${line}\n` + `Key: Plaster\n`;

      const { lineIndex, name, type } = context;
      if (type !== 'no_context') {
        sb += 'Context:\n' + `\tName: ${name}\n` + `\tType: "${type}"\n` + `\tline: ${lineIndex}\n`;
      } else {
        sb += `Context: No context found, make sure you placed your flag correctly\n`;
      }

      if (metaData) {
        sb += `Meta Data:\n`;
        for (const metaDataKey in metaData) {
          const metaDataDetails = metaData[metaDataKey] as string;
          sb += `\t${metaDataKey}:\n`;
          sb +=
            '\t\t' +
            strUtils
              .splitToLines(metaDataDetails)
              .map((m) => m.trim())
              .join('\n\t\t');
          sb += '\n';
        }
      }

      return sb;
    },
  });

  b.addGlobalMetaData(DEFAULT_META_DATA.notes).addGlobalMetaData(DEFAULT_META_DATA.todo);
});