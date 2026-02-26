export default {
  '*.{js,json,md}': 'prettier --write',
  'src/**/*.js': ['npm run lint:js:fix'],
  '*': () => 'gitleaks protect --staged --no-banner --verbose',
}
