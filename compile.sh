rm -rf dist
mkdir -p dist
cp -r server/* dist/ && find dist -type f -iname '*.coffee' -delete
node_modules/.bin/coffee --compile --output dist server