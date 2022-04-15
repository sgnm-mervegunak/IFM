import { I18nJsonParser, I18nOptions } from 'nestjs-i18n';
import * as path from 'path';
export function i18nOptions(directory): I18nOptions {
  return {
    fallbackLanguage: 'tr',
    fallbacks: {
      en: 'en',
      tr: 'tr',
    },
    parser: I18nJsonParser,
    parserOptions: {
      path: path.join(directory, '/i18n/'),
    },
  };
}
