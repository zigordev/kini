module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Dependabot's grouped-update titles ("bump X and Y in the Z group
    // across N directories") routinely land past the conventional-commit
    // default of 100.
    'header-max-length': [2, 'always', 120],
  },
};
