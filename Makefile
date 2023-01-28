lint: 
	npx eslint ./src

startserver:
	npm run startserver

build:
	npm run build

runserver:
	make build && make startserver
