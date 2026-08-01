const i18n = require('./app/i18n').default;

beforeEach(async () => {
  await i18n.changeLanguage('pl');
});
