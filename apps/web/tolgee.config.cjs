function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for Tolgee sync`);
  }
  return value;
}

module.exports = {
  apiUrl: requireEnv('TOLGEE_API_URL'),
  apiKey: requireEnv('TOLGEE_API_KEY'),
  projectId: Number(requireEnv('TOLGEE_PROJECT_ID')),
  format: 'JSON_I18NEXT',
  push: {
    filesTemplate: './messages/{languageTag}.json',
    convertPlaceholdersToIcu: false,
  },
  pull: {
    path: './messages',
    fileStructureTemplate: '{languageTag}.json',
    languages: ['en', 'es'],
    emptyDir: false,
  },
};
